import _ from "lodash";
import { h } from "preact";
import render from "preact-render-to-string";
import express from "express";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { User } from "../users/users.storage.js";
import { createUser } from "../users/users.js";
import { EmailWelcome } from "../../components/email/EmailWelcome.js";
import { sendEmail } from "./email.events.js";
import {
  EmailInvite,
  EmailMatch,
  EmailVerificationApproved,
  EmailVerificationDenied,
} from "../../components/email/EmailNotifications.js";
import { getProfileList } from "../users/profiles.js";

export const router = express.Router();

const mailTester =
  /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

router.post("/api/users", async (req, res) => {
  if (!req.body || !req.body.email) {
    return res.status(400).send({ error: "email is required" });
  }
  if (!mailTester.test(req.body.email)) {
    return res.status(400).send({ error: "Invalid email address" });
  }
  const email = req.body.email.toLowerCase();
  if (!req.session.isHuman) {
    console.error("non-human request for user login", email);
    return res.status(400).send({ error: "Access denied" });
  }
  let user = await User.findOne({ email }).lean().exec();
  console.log("user", user);
  if (!user) {
    user = await createUser({ email });
  }
  if (user.loginCodes.length > 5) {
    console.error("Excessive login code requests for user", email);
    return res
      .status(400)
      .send({
        error: "Exceeded quota, please create a support ticket on discord.",
      });
  }
  const code = Math.random().toString(36).substring(2).substring(0, 8);
  await User.findOneAndUpdate(
    { _id: user._id },
    { $addToSet: { loginCodes: code } }
  ).exec();
  const emailData = (
    <div>
      <EmailWelcome server={process.env.SERVER_URL} code={code} />
    </div>
  );
  const body = render(emailData, {}, {});
  await sendEmail(email, "Welcome to vrerp.net! 💕", body);
  res.send({ ok: "ok" });
});

router.head("/api/users/auth", async (req, res) => {
  const redirectUrl = req.query.url || "/";
  res.redirect(redirectUrl);
});

router.get("/api/users/auth", async (req, res) => {
  if (!req.query || !req.query.code) {
    return res.status(400).send({ error: "code is required" });
  }
  const redirectUrl = req.query.url || "/";
  const user = await User.findOne({ loginCodes: req.query.code }).lean().exec();
  if (!user) {
    console.error(`invalid login code: ${req.query.code}`);
    return res.redirect(redirectUrl);
  }
  req.session.userId = user._id;
  req.user = _.pick(user, [
    "_id",
    "profileId",
    "roles",
    "discordId",
    "adminMessage",
    "email",
  ]);
  Events.emit(EventTypes.LOGIN, user._id);
  await User.findOneAndUpdate(
    { _id: user._id },
    { $pull: { loginCodes: req.query.code } }
  ).exec();
  req.session.save(() => res.redirect(redirectUrl));
});

router.get("/testing/emails/:type", async (req, res) => {
  if (process.env.MODE !== "development") {
    return res.status(404).send({ error: "not found" });
  }

  const profileList = await getProfileList(
    null,
    ["990820298175635457"],
    ["profile"]
  );
  const profile = Object.values(profileList.profiles)[0];
  const avatar = profileList.files[profile.avatar];
  console.log(profile);
  const code = "test";
  const Body = (
    <div>
      {req.params.type === "welcome" && (
        <EmailWelcome server={process.env.SERVER_URL} code={code} />
      )}
      {req.params.type === "match" && (
        <EmailMatch
          server={process.env.SERVER_URL}
          code={code}
          profile={profile}
          avatar={avatar}
        />
      )}
      {req.params.type === "invite" && (
        <EmailInvite
          server={process.env.SERVER_URL}
          code={code}
          profile={profile}
          avatar={avatar}
        />
      )}
      {req.params.type === "approved" && (
        <EmailVerificationApproved
          server={process.env.SERVER_URL}
          code={code}
        />
      )}
      {req.params.type === "denied" && (
        <EmailVerificationDenied server={process.env.SERVER_URL} code={code} />
      )}
    </div>
  );
  const body = render(Body, {}, {});
  res.send(body);
});
