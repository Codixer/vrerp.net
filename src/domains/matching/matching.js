import express from "express";
import { getProfile, getProfileList } from "../users/profiles.js";
import { Profile } from "../users/users.storage.js";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { Match } from "./matching.storage.js";
import { getProfileFiles } from "../users/profiles.js";
import { fullAccess } from "../../helpers/utils.js";
import { UserEvent } from "../events/events.storage.js";
export const router = express.Router();

export const getMatchDB = async (profileId, category) => {
  const c = await Match.findOne({ profileId, category }).lean().exec();
  if (!c || !c.list) {
    return [];
  }
  return c.list.map((item) => item.toString());
};

export const getInvitePending = async (profileId) => {
  const c = await Match.find({ category: "invites", list: profileId })
    .lean()
    .exec();
  return c.map((row) => row.profileId.toString());
};

export const addMatchDb = async (profileId, category, matchProfileId) => {
  const res = await Match.findOneAndUpdate(
    { profileId, category },
    { $addToSet: { list: matchProfileId } },
    { new: true, upsert: true }
  );
  return res.list.map((item) => item.toString());
};

export const removeMatchDb = async (profileId, category, matchProfileId) => {
  const res = await Match.findOneAndUpdate(
    { profileId, category },
    { $pull: { list: matchProfileId } },
    { new: true, upsert: true }
  );
  return res.list.map((item) => item.toString());
};

export const getMatchData = async (profileId) => {
  return {
    invites: (await getMatchDB(profileId, "invites")).reverse(),
    matches: (await getMatchDB(profileId, "matches")).reverse(),
    loves: await getMatchDB(profileId, "loves"),
    invitePending: await getInvitePending(profileId),
  };
};

export const deleteProfileFromMatches = async (profileId) => {
  await Match.updateMany({ list: profileId }, { $pull: { list: profileId } });
  await Match.deleteMany({ profileId });
  return true;
};

router.get("/api/match/next", async (req, res) => {
  if (!fullAccess(req.user)) {
    return res.status(400).send({ error: "please log in" });
  }

  const checked = [req.user.profileId.toString()]
    .concat(await getMatchDB(req.user.profileId, "loves"))
    .concat(await getMatchDB(req.user.profileId, "passes"))
    .concat(await getMatchDB(req.user.profileId, "matches"))
    .concat(await getMatchDB(req.user.profileId, "blocks"));
  const next = await Profile.find({
    profileVisibility: { $in: ["members", "public"] },
    _id: { $nin: checked },
  })
    .sort({ available: -1, lastActivity: -1 })
    .limit(1)
    .lean()
    .exec();
  if (next.length === 0) {
    return res.send({ status: "ok", data: {} });
  }
  res.send({ status: "ok", data: await getProfileList(req, [next[0]._id]) });
});

router.post("/api/match/set-match", async (req, res) => {
  if (!fullAccess(req.user)) {
    return res.status(400).send({ error: "please log in" });
  }
  if (!req.body.profileId || !req.body.match) {
    return res.status(400).send({ error: "profileId and match is required" });
  }
  const thisPerson = req.user.profileId;
  const otherPerson = req.body.profileId;
  if (req.body.match === "love") {
    const invites = await getMatchDB(thisPerson, "invites");
    const otherPersonProfile = await getProfile(req.body.profileId);
    if (invites.includes(otherPerson)) {
      await removeMatchDb(thisPerson, "invites", otherPerson);
      await addMatchDb(thisPerson, "matches", otherPerson);
      await addMatchDb(otherPerson, "matches", thisPerson);
      Events.emit(EventTypes.MATCHED, otherPersonProfile.userId, {
        sourceProfileId: req.user.profileId,
      });
    } else {
      await addMatchDb(thisPerson, "loves", otherPerson);
      await addMatchDb(otherPerson, "invites", thisPerson);
      // eliminate invite-spamming
      const prevInvite = await UserEvent.findOne({
        type: EventTypes.INVITED,
        userId: otherPersonProfile.userId,
        "parameters.sourceProfileId": req.user.profileId,
      })
        .lean()
        .exec();
      if (!prevInvite) {
        Events.emit(EventTypes.INVITED, otherPersonProfile.userId, {
          sourceProfileId: req.user.profileId,
        });
      }
    }
  } else if (req.body.match === "pass") {
    const existingMatches = await getMatchDB(thisPerson, "matches");
    if (existingMatches.includes(otherPerson)) {
      const otherPersonProfile = await getProfile(req.body.profileId);
      Events.emit(EventTypes.UNMATCHED, otherPersonProfile.userId, {
        sourceProfileId: req.user.profileId,
      });
    }
    await removeMatchDb(thisPerson, "invites", otherPerson);
    await removeMatchDb(thisPerson, "loves", otherPerson);
    await removeMatchDb(thisPerson, "matches", otherPerson);
    await removeMatchDb(otherPerson, "matches", thisPerson);
    await removeMatchDb(otherPerson, "invites", thisPerson);
    await addMatchDb(thisPerson, "passes", otherPerson);
  }
  return res.send({ status: "ok", data: await getMatchData(thisPerson) });
});

router.delete("/api/match/passes", async (req, res) => {
  if (!fullAccess(req.user)) {
    return res.status(400).send({ error: "please log in" });
  }
  await Match.deleteOne({
    profileId: req.user.profileId,
    category: "passes",
  }).exec();
  return res.send({
    status: "ok",
    data: await getMatchData(req.user.profileId),
  });
});
