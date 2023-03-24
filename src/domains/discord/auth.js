import _, { join } from "lodash";
import express from "express";
import axios from "axios";
import qs from "qs";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { isMainEntry } from "../../helpers/utils.js";
import { User, Profile } from "../users/users.storage.js";
import { applyInviteCode } from "../invites/siteInvites.js";
import { createUser } from "../users/users.js";
import { testingDiscordProfile } from "../testing/fixtures.js";
import { updateUserStatus } from "../status/status.js";
import { Status } from "../status/status.storage.js";
import { syncMemberRoles } from "./roles.js";

export const router = express.Router();

async function getAccessToken(code, api) {
  const data = {
    client_id: process.env.DISCORD_CLIENT_ID,
    client_secret: process.env.DISCORD_CLIENT_SECRET,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: `${process.env.SERVER_URL}api/discord/${api}`,
  };
  console.log(qs.stringify(data));
  try {
    const d = await axios({
      url: `https://discord.com/api/v10/oauth2/token`,
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: qs.stringify(data),
    });
    const auth = `${_.get(d, "data.token_type")} ${_.get(
      d,
      "data.access_token"
    )}`;
    return auth;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// Create a function to join a discord server provided by process.env.MAIN_DISCORD_ID. Pull the user ID from discordProfile.id and the access token from discordProfile.accessCode. If the return value is 201 or 204, return true. If is it anything else, return false.
async function joinDiscordServer(discordProfile) {
  try {
    const d = await axios({
      url: `https://discord.com/api/v10/guilds/${process.env.MAIN_DISCORD_ID}/members/${discordProfile.id}`,
      method: "PUT",
      access_token: discordProfile.accessCode,
      headers: { 
        "content-type": "application/json",
        "authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`
      },
    });
    if (d.status === 201 || d.status === 204) {
      console.log("Joined discord server (Or already joined).");
      return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
}

async function getDiscordProfile(req, api) {
  const code = req.query.code;
  if (!code) {
    return null;
  }
  let discordProfile = null;
  if (
    ["development", "testing"].includes(process.env.MODE) &&
    code === "testingcode"
  ) {
    return testingDiscordProfile;
  }

  const accessCode = await getAccessToken(code, api);
  if (!accessCode) {
    return null;
  }
  const d = await axios("https://discord.com/api/users/@me", {
    headers: {
      authorization: accessCode,
    },
  });

  d.data.accessCode = accessCode;
  return d.data;
}

// these would be otherwise handled by the get request and consume the token
router.head("/api/discord/auth", async (req, res) => {
  const redirect = req.query.state ? req.query.state : "/";
  res.redirect(redirect);
});

router.head("/api/discord/link", async (req, res) => {
  const redirect = req.query.state ? req.query.state : "/onboarding/basicinfo";
  res.redirect(redirect);
});

router.get("/api/discord/link", async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/");
  }
  const discordProfile = await getDiscordProfile(req, "link");
  if (!discordProfile) {
    return res.redirect("/");
  }

  console.log("Connecting user to discord server.");
  const loginUser = await User.findOne({ _id: req.session.userId })
    .lean()
    .exec();
  const testUser = await User.findOne({ discordId: discordProfile.id })
    .lean()
    .exec();
  if (testUser) {
    console.error("discord user already", req.user, testUser);
    res.send(
      "There is a user with this discord profile already -we need to delete it before you can link it. DM Codixer#2936 to troubleshoot"
    );
    return;
  }
  const discord = `${discordProfile.username}#${discordProfile.discriminator}`;
  await User.findOneAndUpdate(
    { _id: req.session.userId },
    { discord, discordId: discordProfile.id }
  );
  const previousStatus = await Status.findOne({ discordId: discordProfile.id })
    .lean()
    .exec();
  const updatedStatus = { discord, discordId: discordProfile.id };
  if (previousStatus) {
    if (
      previousStatus.userId &&
      previousStatus.userId.toString() !== req.session.userId.toString()
    ) {
      console.error("discord user already", req.user, previousStatus);
      res.send(
        "There is a user with this discord profile already -we need to delete it before you can link it. DM Codixer#2936 to troubleshoot"
      );
      return;
    }
    await Status.deleteOne({ discordId: discordProfile.id });
    updatedStatus.guilds = previousStatus.guilds;
  }
  await updateUserStatus({ userId: req.session.userId }, updatedStatus);
  await Profile.findOneAndUpdate({ _id: req.user.profileId }, { discord });
  await syncMemberRoles(req.session.userId);
  const redirect = req.query.state ? req.query.state : "/onboarding/basicinfo";
  req.session.save(() => res.redirect(redirect));
});

router.get("/api/discord/auth", async (req, res, next) => {
  const discordProfile = await getDiscordProfile(req, "auth");
  if (!discordProfile) {
    return res.redirect("/");
  }
  
  console.log("authorizing discord user", discordProfile);
  // create new user, or log in
  let user = await User.findOne({ discordId: discordProfile.id }).lean().exec();
  const discord = `${discordProfile.username}#${discordProfile.discriminator}`;
  if (!user) {
    user = await createUser({ discord, discordId: discordProfile.id });
    req.session.userId = user._id;
  } else {
    await Profile.findOneAndUpdate({ userId: user._id }, { discord });
    await User.findOneAndUpdate({ _id: user._id }, { discord });
    req.session.userId = user._id;
    Events.emit(EventTypes.LOGIN, user._id);
  }
  if (req.cookies["invite-code"]) {
    console.log("applying invite code", req.cookies["invite-code"]);
    await applyInviteCode(
      user._id,
      user.discordId,
      discord,
      req.cookies["invite-code"]
    );
    res.setHeader("Set-Cookie", "invite-code=; Path=/; Expires=1");
  }


  console.log("Connecting user to discord server.");
  let joined = joinDiscordServer(discordProfile);

  joined ? console.log("User joined the discord server.") : console.log("User was not able to join the discord server.");



  const redirect = req.query.state ? req.query.state : "/";
  req.session.save(() => res.redirect(redirect));
});

if (isMainEntry(import.meta.url)) {
  (async () => {
    console.log(await getAccessToken("T3rszItTgiE10pwDyiM9tRu56HhbBF", "auth"));
  })();
}
