import _ from "lodash";
import express from "express";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { generateSnowflake } from "../../helpers/utils.js";
import { allRoles } from "../../shared.js";
import { getProfileList } from "../users/profiles.js";
import { banUser, deleteUserByProfileId } from "../users/users.js";
import { Profile, User } from "../users/users.storage.js";
import { Verification } from "../verification/verification.storage.js";
import { syncMemberRoles } from "../discord/roles.js";

export const router = express.Router();

const adminAllowance = ["profile", "status", "discord", "fantasies"];

router.get(
  ["/api/moderator/profiles", "/api/moderator/member-profiles"],
  async (req, res) => {
    console.log(req);
    let filter = {};
    if (req.query.status) {
      filter.profileVisibility = req.query.status;
    }
    if (req.query.lastId) {
      filter._id = { $lt: req.query.lastId };
    }
    if (req.url.startsWith("/api/moderator/member-profiles")) {
      filter.profileVisibility = { $in: ["public", "hidden", "members"] };
    }
    const allprofiles = await Profile.find(filter)
      .select({ _id: 1 })
      .sort({ createdAt: -1 })
      .limit(64)
      .lean()
      .exec();
    const ids = allprofiles.map((p) => p._id);
    res.send({
      status: "ok",
      data: { ...(await getProfileList(req, ids, adminAllowance)), list: ids },
    });
  }
);

router.post("/api/moderator/profiles", async (req, res) => {
  let existingProfile = await Profile.findOne({ username: req.body.username })
    .lean()
    .exec();
  if (existingProfile) {
    return res.status(400).send({ error: "Profile already exists" });
  }
  const profile = new Profile({
    _id: generateSnowflake(),
    userId: req.user._id,
    username: req.body.username,
  });
  await profile.save();
  res.send({ status: "ok", data: { profileId: profile._id } });
});

router.get("/api/admin/users", async (req, res) => {
  const users = (await User.find({}).lean().exec()).map((user) =>
    _.pick(user, ["_id", "email", "username", "profileId"])
  );
  res.send({ status: "ok", data: { users } });
});

router.post(
  "/api/moderator/moderate/:profileId/:moderate",
  async (req, res) => {
    if (req.params.moderate === "banned") {
      let profile = await Profile.findOne({ _id: req.params.profileId })
        .lean()
        .exec();
      await banUser(profile.userId, req.body.adminMessage);
      profile = await Profile.findOne({ _id: req.params.profileId })
        .lean()
        .exec();
      return res.send({ status: "ok", data: { profile } });
    } else if (req.params.moderate === "suspended") {
      const profile = await Profile.findOneAndUpdate(
        { _id: req.params.profileId },
        { profileVisibility: req.params.moderate },
        { new: true }
      ).exec();
      await User.findOneAndUpdate(
        { profileId: req.params.profileId },
        {
          $addToSet: {
            roles: req.params.moderate,
            adminMessage: req.body.adminMessage,
          },
        }
      ).exec();
      Events.emit(EventTypes.USER_SUSPENDED, profile.userId, {
        message: req.body.adminMessage,
      });
      return res.send({ status: "ok", data: { profile } });
    } else if (req.params.moderate === "delete") {
      await deleteUserByProfileId(req.params.profileId);
      return res.send({ status: "ok", data: {} });
    } else if (req.params.moderate === "revoke") {
      const profile = await Profile.findOne({ _id: req.params.profileId })
        .lean()
        .exec();
      const user = await User.findOneAndUpdate(
        { _id: profile.userId },
        { $pull: { roles: { $in: ["onboarded", "verified"] } } },
        { new: true }
      ).exec();
      await Verification.deleteMany({ discordId: user.discordId }).exec();
      await Profile.findOneAndUpdate(
        { _id: req.params.profileId },
        { profileVisibility: "hidden" }
      ).exec();
      await syncMemberRoles(profile.userId);
      return res.send({
        status: "ok",
        data: await getProfileList(req, [req.params.profileId]),
      });
    }
    throw new Error(`Unknown moderation: ${req.params.moderate}`);
  }
);

router.get("/api/admin/roles/:profileId", async (req, res) => {
  const profile = await Profile.findOne({ _id: req.params.profileId })
    .lean()
    .exec();
  const user = await User.findOne({ _id: profile.userId }).lean().exec();
  res.send({ status: "ok", data: { roles: user.roles, allRoles } });
});

router.post("/api/admin/roles/:profileId", async (req, res) => {
  if (!req.body.newRoles) {
    return res.status(400).send({ error: "newRoles required" });
  }
  const profile = await Profile.findOne({ _id: req.params.profileId })
    .lean()
    .exec();
  const user = await User.findOneAndUpdate(
    { _id: profile.userId },
    { roles: req.body.newRoles },
    { new: true }
  )
    .lean()
    .exec();

  res.send({ status: "ok", data: { roles: user.roles, allRoles } });
});

router.get("/api/moderator/search", async (req, res) => {
  const maxItems = 20;
  if (req.query.q === "") {
    return res.send({ status: "ok", data: { list: [] } });
  }
  const filter = new RegExp(req.query.q, "i");
  console.log(filter);
  const profiles = await Profile.find({
    $or: [
      { _id: req.query.q },
      { username: filter },
      { discord: filter },
      { vrchat: filter },
      { url: filter },
    ],
  })
    .select(["_id"])
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  let list = profiles.map((p) => p._id.toString());
  console.log("list.length", list.length);
  if (req.query.lastId) {
    let cutIndex = list.indexOf(req.query.lastId);
    if (cutIndex === -1) {
      cutIndex = 0;
    }
    console.log("cutIndex", cutIndex);
    list = list.splice(cutIndex, maxItems);
  } else {
    list = list.splice(0, maxItems);
  }
  res.send({
    status: "ok",
    data: { ...(await getProfileList(req, list, adminAllowance)), list },
  });
});
