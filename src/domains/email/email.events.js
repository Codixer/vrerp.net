import { h } from "preact";
import _ from "lodash";
import render from "preact-render-to-string";
import AWS from "aws-sdk";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";
import { Profile, User } from "../users/users.storage.js";
import { NOTIFICATION_INVITE } from "../../shared.js";
import { getProfileList } from "../users/profiles.js";
import {
  EmailInvite,
  EmailMatch,
  EmailVerificationApproved,
  EmailVerificationDenied,
} from "../../components/email/EmailNotifications.js";

AWS.config.update({
  region: "default",
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

export async function sendEmail(email, subject, html) {
  console.log(`sending email to ${email} ${subject}`);
  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: html,
        },
        Text: {
          Charset: "UTF-8",
          Data: html,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: "vrerp.net <stefano@stefanocoding.me>",
    ReplyToAddresses: ["vrerp@pm.me"],
  };
  console.log(html);
  const res = await ses.sendEmail(params).promise();
  console.log("email sending result: ", res);
  return true;
}

const notificationWithProfile = (type) => async (userId, parameters) => {
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user || !user.email) {
    return;
  }
  const userProfile = await Profile.findOne({ _id: user.profileId });
  if (
    !userProfile ||
    !(userProfile.discordNotifications & NOTIFICATION_INVITE)
  ) {
    return false;
  }
  const otherProfileList = await getProfileList(
    null,
    [parameters.sourceProfileId],
    ["profile"]
  );
  const profile = Object.values(otherProfileList.profiles)[0];
  const avatar = otherProfileList.files[profile.avatar];
  const code = Math.random().toString(36).substring(2).substring(0, 8);
  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { loginCodes: code } }
  ).exec();

  const emailData = (
    <div>
      {type === "invite" && (
        <EmailInvite
          server={process.env.SERVER_URL}
          code={code}
          profile={profile}
          avatar={avatar}
        />
      )}
      {type === "match" && (
        <EmailMatch
          server={process.env.SERVER_URL}
          code={code}
          profile={profile}
          avatar={avatar}
        />
      )}
    </div>
  );
  const body = render(emailData, {}, {});
  const subject =
    type === "invite"
      ? `${profile.username} wants to be your lewdie 💕 -vrerp.net`
      : `Matched with ${profile.username} 💕 -vrerp.net`;
  await sendEmail(user.email, subject, body);
  return true;
};

const inviteNotifications = notificationWithProfile("invite");
const matchNotifications = notificationWithProfile("match");

const verificationNotification = (type) => async (userId, parameters) => {
  if (!userId) {
    return;
  }
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user || !user.email) {
    return;
  }
  const code = Math.random().toString(36).substring(2).substring(0, 8);
  await User.findOneAndUpdate(
    { _id: userId },
    { $addToSet: { loginCodes: code } }
  ).exec();
  const { rejectionMessage } = parameters;
  const emailData = (
    <div>
      {type === "approved" && (
        <EmailVerificationApproved
          server={process.env.SERVER_URL}
          code={code}
        />
      )}
      {type === "denied" && (
        <EmailVerificationDenied
          server={process.env.SERVER_URL}
          code={code}
          message={rejectionMessage}
        />
      )}
    </div>
  );
  const body = render(emailData, {}, {});
  const subject =
    type === "approved"
      ? `You're in! -vrerp.net`
      : `Failed to verify -vrerp.net`;
  await sendEmail(user.email, subject, body);
  return true;
};

const approvedVerification = verificationNotification("approved");
const deniedVerification = verificationNotification("denied");

export async function initEmail() {
  Events.listen(
    EventTypes.INVITED,
    Events.ListenerType.GLOBAL,
    inviteNotifications
  );
  Events.listen(
    EventTypes.MATCHED,
    Events.ListenerType.GLOBAL,
    matchNotifications
  );
  Events.listen(
    EventTypes.VERIFICATION_APPROVED,
    Events.ListenerType.GLOBAL,
    approvedVerification
  );
  Events.listen(
    EventTypes.VERIFICATION_DENIED,
    Events.ListenerType.GLOBAL,
    deniedVerification
  );
}
