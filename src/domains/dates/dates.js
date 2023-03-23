import _ from "lodash";
import express from "express";
import { getTimeZones } from "@vvo/tzdb";
import { UserDateInstance, UserDateProfile } from "./dates.storage.js";
import { fullAccess, generateSnowflake } from "../../helpers/utils.js";
import { Profile } from "../users/users.storage.js";
import { getProfileData, getProfileList } from "../users/profiles.js";
import mongoose from "mongoose";

const { mongo } = mongoose;
export const router = express.Router();

export async function hasDatesSetup(userId) {
  const dateProfile = await UserDateProfile.findOne({ userId }).lean().exec();
  return !!(dateProfile && dateProfile.available && dateProfile.userTimezone);
}

router.get("/api/dates/timezones", async (req, res, next) => {
  const timezones = getTimeZones().sort((a, b) => (a.name > b.name ? 1 : -1));
  const dateProfile = await UserDateProfile.findOne({
    userId: req.session.userId,
  })
    .lean()
    .exec();
  const userTimezone = dateProfile ? dateProfile.userTimezone : null;
  res.send({ status: "ok", data: { timezones, userTimezone } });
});

async function updateAvailability(req) {
  const update = {
    $setOnInsert: { _id: generateSnowflake() },
    userId: req.session.userId,
    username: req.userProfile.username,
  };
  if (req.body.userTimezone) {
    update.userTimezone = req.body.userTimezone;
  }
  if (
    req.body.userTimezoneOffset &&
    !isNaN(parseInt(req.body.userTimezoneOffset))
  ) {
    update.userTimezoneOffset = parseInt(req.body.userTimezoneOffset);
  }
  if (req.body.available) {
    update.available = req.body.available;
  }
  await UserDateProfile.findOneAndUpdate(
    { userId: req.session.userId },
    update,
    { upsert: true, new: true }
  );
}

// timezone updates are ok for non-verified users -this only requires being logged on
router.post("/api/dates/timezones", async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(400).send({ error: "logged in user required" });
  }
  if (!req.body || !req.body.userTimezone) {
    return res.status(401).send({ error: "userTimezone is required" });
  }
  await updateAvailability(req);
  res.send({ status: "ok" });
});

router.get("/api/dates/available", async (req, res, next) => {
  if (!req.session || !req.session.userId || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  const timezones = getTimeZones().sort((a, b) => (a.name > b.name ? 1 : -1));
  const dateProfile = await UserDateProfile.findOne({
    userId: req.session.userId,
  })
    .lean()
    .exec();
  const available = dateProfile ? dateProfile.available : Array(7 * 48).fill(0);
  const userTimezone = dateProfile ? dateProfile.userTimezone : 0;
  res.send({ status: "ok", data: { timezones, available, userTimezone } });
});

router.post("/api/dates/available", async (req, res, next) => {
  if (!req.session || !req.session.userId || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  if (!req.body || !req.body.available) {
    return res.status(401).send({ error: "available is required" });
  }
  await updateAvailability(req);
  res.send({ status: "ok" });
});

router.get("/api/dates/available/:url", async (req, res, next) => {
  if (!req.session || !req.session.userId || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  const profile = await Profile.findOne({ url: req.params.url }).lean().exec();
  if (!profile) {
    return res.status(404).send({ error: "no such profile" });
  }
  const dateProfile = await UserDateProfile.findOne({ userId: profile.userId })
    .lean()
    .exec();
  if (!dateProfile) {
    return res.status(404).send({ error: "no dateprofile" });
  }

  const timezones = getTimeZones().sort((a, b) => (a.name > b.name ? 1 : -1));
  res.send({
    status: "ok",
    data: {
      ...(await getProfileList(req, [profile._id])),
      timezones,
      ..._.omit(dateProfile, ["_id", "__v", "createdAt", "updatedAt"]),
    },
  });
});

const getDates = async (userId) =>
  UserDateInstance.find({
    $or: [{ invited: userId }, { inviter: userId }],
    startDate: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

router.get("/api/dates", async (req, res, next) => {
  console.log(req.session.userId.toString());
  if (!req.session || !req.session.userId || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  let dates = await getDates(req.user.id);
  const allUserIds = _.uniq(
    _.flatMap(dates, (date) => [date.invited, date.inviter])
  ).filter((id) => id.toString() !== req.user.id.toString());
  const allProfileIdMap = await Profile.find({ userId: { $in: allUserIds } })
    .select(["_id", "userId"])
    .lean()
    .exec();
  const allProfileIds = allProfileIdMap.map((p) => p._id);
  const profiles = await getProfileList(req, allProfileIds);
  res.send({ status: "ok", data: { dates, ...profiles } });
});

router.post("/api/dates/invite", async (req, res, next) => {
  if (!req.session || !req.session.userId || !fullAccess(req.user)) {
    return res.status(400).send({ error: "logged in user required" });
  }
  if (!req.body || !req.body.invited || !req.body.startDate) {
    return res.status(401).send({ error: "invited and startDate is required" });
  }
  await UserDateInstance.create({
    _id: generateSnowflake(),
    status: "invited",
    inviter: req.session.userId,
    invited: req.body.invited,
    startDate: req.body.startDate,
    message: req.body.message,
  });
  res.send({ status: "ok", data: await getDates(req.session.userId) });
});
