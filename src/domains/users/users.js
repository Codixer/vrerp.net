import _ from "lodash";
import mongoose from "mongoose";
import express from "express";
import { default as session } from "express-session";
import MongoStore from "connect-mongo";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import {
  fullAccess,
  generateSnowflake,
  isMainEntry,
} from "../../helpers/utils.js";
import { Profile, User } from "./users.storage.js";
import { deleteProfileFromMatches } from "../matching/matching.js";
import { deleteProfile } from "./profiles.js";
import { generateInviteCode } from "../invites/siteInvites.js";
import { usernameToURL, validateUsername } from "./usernames.js";
import {
  deleteUserStatus,
  getUserStatus,
  updateUserStatus,
} from "../status/status.js";
import { syncMemberRoles } from "../discord/roles.js";
import { connect } from "../../helpers/connect.js";
import { Report } from "../reports/reports.storage.js";
import { publicReport } from "../reports/reports.js";
import { getFrontpageMessages } from "../frontpage/messages.js";

const router = express.Router();

let sessionParser = null;

export const getSessionParser = () => {
  if (!sessionParser) {
    sessionParser = session({
      name: "vrerp",
      secret: "da6f15cf0d2a3be6f0c8ef59f94dfe02",
      store: MongoStore.create({
        client: mongoose.connection.client,
        collectionName: "sessions",
        stringify: false,
      }),
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 * 5 }, // 5 year timeout
      resave: false,
      saveUninitialized: false,
    });
  }
  return sessionParser;
};

async function basicData(req, res, next) {
  if (req.session.userId) {
    const user = await User.findOne({ _id: req.session.userId }).lean().exec();
    if (!user) {
      req.sessionStore.generate(req);
      delete req.user;
      next();
      return;
    }
    req.user = _.pick(user, [
      "_id",
      "profileId",
      "roles",
      "discordId",
      "adminMessage",
      "inviteCode",
      "email",
    ]);
    req.user.id = req.user._id;
    req.user.reported = publicReport(
      await Report.findOne({
        accusedId: req.user.id,
        status: "userNotification",
      })
        .lean()
        .exec()
    );
    req.userProfile = await Profile.findOneAndUpdate(
      { _id: user.profileId },
      { $set: { lastActivity: new Date() } },
      { new: true }
    );
    if (user.roles && user.roles.includes("banned")) {
      return res.send("banned. DM Codixer#2936 to appeal.");
    }
  }
  next();
}

export async function deleteUserByProfileId(profileId) {
  const profile = await Profile.findOne({ _id: profileId }).lean().exec();
  if (!profile) {
    throw new Error("Profile not found", profileId);
  }
  await deleteProfileFromMatches(profileId);
  await deleteProfile(profileId);
  await deleteUserStatus(profile.userId);
  await User.deleteOne({ _id: profile.userId });
  Events.emit(EventTypes.USER_DELETED, profile.userId);
  return true;
}

export async function createUser(userInfo = {}) {
  const userId = generateSnowflake();
  const profile = new Profile({
    _id: generateSnowflake(),
    userId,
    discord: userInfo.discord,
  });
  let baseUsername = userInfo.discord
    ? userInfo.discord.split("#")[0]
    : userInfo.email.split("@")[0];
  profile.username = baseUsername
    .replace(/[ #/\\._-]/g, "-")
    .replace(/[#!?]/g, "");
  for (let i = 0; i < 10; i++) {
    if ((await validateUsername(profile.username, profile._id)) === null) {
      break;
    }
    profile.username += "1";
  }
  if ((await validateUsername(profile.username, profile._id)) !== null) {
    profile.username = "";
  }
  profile.url = usernameToURL(profile.username);
  await profile.save();
  const user = new User({ _id: userId, profileId: profile._id, ...userInfo });
  await user.save();
  Events.emit(EventTypes.REGISTERED, user._id);
  return user;
}

export async function getUserFromString(s) {
  let profile = await Profile.findOne({
    $or: [{ url: s }, { username: s }, { discord: s }],
  })
    .lean()
    .exec();
  if (profile) {
    return profile.userId;
  }
  return null;
}

export async function banUser(userId, adminMessage) {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    { profileVisibility: "banned" },
    { new: true }
  ).exec();
  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { roles: "banned", adminMessage: adminMessage } }
  ).exec();
  await syncMemberRoles(userId);
  return true;
}

router.post("/api/users/logout", async (req, res) => {
  // await req.session.regenerate();
  // only generate, do not destory
  Events.emit(EventTypes.LOGOUT, req.user._id);
  req.sessionStore.generate(req);
  delete req.user;
  res.send({ status: "ok", data: await hydrateUser(req) });
});

router.post("/api/users/activate", async (req, res) => {
  if (
    !req.user ||
    !req.user.roles ||
    !req.user._id ||
    !req.user.roles.includes("verified")
  ) {
    return res.status(400).send({ error: "please log in" });
  }
  await User.findOneAndUpdate(
    { _id: req.user._id },
    { $addToSet: { roles: "onboarded" } }
  );
  req.user.roles.push("onboarded");
  Events.emit(EventTypes.ONBOARDED, req.user._id);
  res.send({ status: "ok", data: await hydrateUser(req) });
});

router.delete("/api/users/me", async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).send({ error: "please log in" });
  }
  await deleteUserByProfileId(req.user.profileId);
  req.sessionStore.generate(req);
  delete req.user;
  res.send({ status: "ok" });
});

router.post("/api/users/deactivate", async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).send({ error: "please log in" });
  }
  const profile = await Profile.findOneAndUpdate(
    { _id: req.user.profileId },
    { profileVisibility: "suspended" },
    { new: true }
  ).exec();
  await User.findOneAndUpdate(
    { profileId: req.user.profileId },
    {
      $addToSet: { roles: "suspended" },
      $set: { adminMessage: "Suspended by your request" },
    }
  ).exec();
  req.sessionStore.generate(req);
  delete req.user;
  return res.send({ status: "ok" });
});

router.post("/api/users/reactivate", async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).send({ error: "please log in" });
  }
  const profile = await Profile.findOneAndUpdate(
    { _id: req.user.profileId },
    { profileVisibility: "members" },
    { new: true }
  ).exec();
  await User.findOneAndUpdate(
    { profileId: req.user.profileId },
    { $pull: { roles: "suspended" }, $unset: { adminMessage: "" } }
  ).exec();
  return res.send({ status: "ok" });
});

router.post("/api/users/sync", async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).send({ error: "please log in" });
  }
  await syncMemberRoles(req.user._id);
  res.send({ status: "ok" });
});

router.post("/api/users/status", async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(400).send({ error: "please log in" });
  }
  if (
    !["horny", "available", "online", "unavailable"].includes(req.body.status)
  ) {
    return res.status(400).send({ error: "invalid status" });
  }
  await updateUserStatus(
    { userId: req.user._id },
    { hornyStatus: req.body.status }
  );
  res.send({ status: "ok", data: await hydrateUser(req) });
});

export const userHandler = () => {
  // console.log('mongoose client', mongoose.connection.client);
  const userRouter = express.Router();
  userRouter.use(getSessionParser());
  userRouter.use(basicData);
  userRouter.use(router);
  return userRouter;
};

export const hydrateUser = async (req) => {
  if (!req.session) {
    return {};
  }
  let data = { isHuman: req.session.isHuman, ageCheck: !!req.session.ageCheck };
  if (req.user) {
    data = { ...data, ..._.omit(req.user, "_id"), id: req.user._id };
    if (fullAccess(req.user) && !req.user.inviteCode) {
      data.inviteCode = req.user.inviteCode = await generateInviteCode(
        req.user._id
      );
    }
    data = {
      ...data,
      ...(await getUserStatus({ userId: req.user._id })),
      messages: await getFrontpageMessages(req),
    };
  }
  return { user: data };
};

if (isMainEntry(import.meta.url)) {
  (async () => {
    await connect();
    console.log(process.argv);
    if (process.argv.length < 3) {
      console.log("usage: users.js [delete [profileId]]");
      process.exit(0);
    }
    if (process.argv[2] === "delete") {
      const profileId = process.argv[3];
      console.log(`deleting ${profileId}`);
      await deleteUserByProfileId(profileId);
    }
  })();
}
