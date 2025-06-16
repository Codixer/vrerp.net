import _ from "lodash";
import express from "express";

import { UserEvent } from "../events/events.storage.js";
import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";
import { fullAccess } from "../../helpers/utils.js";
import { snowflakeToDate } from "../../shared.js";
import { hasRole } from "../../components/scripts/utils.js";
import { Profile } from "../users/users.storage.js";

export const messageRouter = express.Router();

const frontpageMessages = [
  {
    type: "checkin-erp-anyone",
    minDays: 7,
    frequency: 14,
    message: [
      "Hi-hi 🤗 thank you for being with us 💕",
      "We'd love to check-in to see how you're doing and if there's anything we can do to make you comfy 🤗",
      " 💕💕💕 ",
      "How many new peeps have you met in-vr from vrerp.net in the past 2 weeks?",
    ],
    replies: [
      { text: "None", value: 0 },
      { text: "1-2", value: 1 },
      { text: "3-10", value: 3 },
      { text: "10+", value: 10 },
    ],
  },
  {
    type: "checkin-community",
    minDays: 7,
    frequency: 14,
    message: ["How do you feel about our community overall?"],
    replies: [
      { text: "👎", value: -2 },
      { text: "😞", value: -1 },
      { text: "😊", value: 1 },
      { text: "🥰", value: 2 },
    ],
  },
  {
    type: "checkin-erp-amount",
    minDays: 7,
    frequency: 14,
    message: ["How do you feel about the amount of ERP you're having?"],
    replies: [
      { text: "too little", value: -1 },
      { text: "just right", value: 0 },
      { text: "too much", value: 1 },
    ],
  },
  {
    type: "featured",
    role: "featured",
    message: [
      "You're super cute 💕",
      "The High Council would love to feature a few selected super cute peeps on the frontpage, and on the site.",
      "Can we feature your profile?",
      "(You can change this anytime in the settings menu)",
    ],
    replies: [
      { text: "yes", value: true },
      { text: "no", value: false },
    ],
  },
];

export const getFrontpageMessages = async (req) => {
  const replies = await UserEvent.find({
    type: EventTypes.MESSAGE_REPLIED,
    userId: req.user.id,
  })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  const replyTypes = _.groupBy(replies, "parameters.messageType");
  const res = frontpageMessages.filter((s) => {
    if (s.minDays) {
      const userTime = new Date() - snowflakeToDate(req.user.id);
      if (userTime < s.minDays * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
    if (s.role && !hasRole(req.user, s.role)) {
      return false;
    }
    if (replyTypes[s.type] && replyTypes[s.type].length > 0) {
      if (!s.frequency) {
        return false;
      }
      const responseTime = _.get(replyTypes, [s.type, 0, "createdAt"]);
      if (!responseTime) {
        return true;
      }
      if (new Date() - responseTime < s.frequency * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
    return true;
  });
  return res;
};

messageRouter.post("/api/messsages/replies", async (req, res) => {
  if (!req.user || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  if (!req.body.type || !req.body.value) {
    return res.status(400).send({ error: "type and value are required" });
  }
  if (req.body.type === "featured") {
    const value = req.body.value === "true";
    await Profile.findOneAndUpdate(
      { _id: req.user.profileId },
      { featured: value }
    );
  }
  await Events.emit(EventTypes.MESSAGE_REPLIED, req.user.id, {
    messageType: req.body.type,
    response: req.body.value,
  });
  res.send({ status: "ok", data: { text: "thank you!" } });
});
