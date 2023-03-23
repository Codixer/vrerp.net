// API endpoints for admin + moderator roles
import _ from "lodash";
import express from "express";
import { Verification } from "../verification/verification.storage.js";
import { getFilesByIds, publicFile } from "../files/userFiles.js";
import { Profile, User } from "../users/users.storage.js";
import { setVerificationStatus } from "../verification/verification.js";
import { publicObject } from "../../helpers/utils.js";
import { UserEvent } from "../events/events.storage.js";
import { UserFile } from "../files/userFiles.storage.js";
import { getUserToProfileMapping } from "../users/profiles.js";

export const router = express.Router();

router.use("/api/moderator/*", async (req, res, next) => {
  if (
    !req.user ||
    !req.user.roles ||
    !(req.user.roles.includes("admin") || req.user.roles.includes("mod"))
  ) {
    return res.status(400).send({ error: "access denied" });
  }
  return next();
});

async function addVerificationInfo(verifications) {
  const files = await getFilesByIds(verifications.map((v) => v.image));
  const discordIds = verifications.map((v) => v.discordId).filter((v) => v);
  const userIds = verifications.map((v) => v.userId).filter((v) => v);
  const users = await User.find({
    $or: [{ discordId: { $in: discordIds } }, { _id: { $in: userIds } }],
  })
    .lean()
    .exec();
  const usersById = _.keyBy(users, "_id");
  const profileIds = users.map((u) => u.profileId);
  const allProfiles = await Profile.find({ _id: { $in: profileIds } })
    .lean()
    .exec();
  const allProfilesByDiscord = _.keyBy(allProfiles, "discord");
  const allProfilesByUser = _.keyBy(allProfiles, "userId");
  verifications = verifications.map((v) => {
    if (v.discord && allProfilesByDiscord[v.discord]) {
      v.url = allProfilesByDiscord[v.discord].url;
      v.profileId = allProfilesByDiscord[v.discord]._id;
    } else if (v.userId && allProfilesByUser[v.userId]) {
      v.url = allProfilesByUser[v.userId].url;
      v.profileId = allProfilesByUser[v.userId]._id;
      v.email = usersById[v.userId].email;
    }
    return v;
  });
  return { verifications, files };
}

router.get("/api/moderator/verifications-audit-log", async (req, res) => {
  let verifications = (
    await Verification.find({ status: { $nin: ["pending", "draft"] } })
      .sort({ updatedAt: -1 })
      .limit(64)
      .lean()
      .exec()
  ).map((d) => publicObject(d));
  res.send({ status: "ok", data: await addVerificationInfo(verifications) });
});

router.get("/api/moderator/verifications", async (req, res) => {
  let verifications = (
    await Verification.find({ status: "pending" })
      .sort({ updatedAt: 1 })
      .lean()
      .exec()
  ).map((d) => publicObject(d));
  res.send({ status: "ok", data: await addVerificationInfo(verifications) });
});

router.post("/api/moderator/verifications/:id", async (req, res) => {
  if (!req.body.status) {
    res.status(401).send({ error: "status is required" });
  }
  let verification = await Verification.findOne({ _id: req.params.id })
    .lean()
    .exec();
  if (!verification) {
    res.status(401).send({ error: "verification not found" });
  }
  verification = setVerificationStatus(
    verification.discordId,
    verification.discord,
    verification.userId,
    req.body.status,
    req.user.id,
    req.body.rejectionReason
  );
  res.send({
    status: "ok",
    data: { verification: publicObject(verification) },
  });
});

router.get("/api/moderator/mood", async (req, res) => {
  let moods = await UserEvent.find({ type: "message-replied" })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  const userIds = Array.from(new Set(moods.map((m) => m.userId)));
  let users = await Profile.find({ userId: { $in: userIds } })
    .select(["userId", "url", "username"])
    .lean()
    .exec();
  users = _.keyBy(
    users.map((u) => {
      return { ..._.omit(u, "_id"), id: u.userId };
    }),
    "id"
  );
  moods = moods.map((m) => {
    m.group = `${m.userId.toString()}-${m.updatedAt
      .toISOString()
      .substr(0, 10)}`;
    return m;
  });
  moods = _.groupBy(moods, "group");
  res.send({ status: "ok", data: { moods, users } });
});

router.get("/api/moderator/images", async (req, res) => {
  const filter = {};
  if (req.query.lastId) {
    filter._id = { $lt: req.query.lastId };
  }

  let files = await UserFile.find(filter)
    .sort({ createdAt: -1 })
    .limit(32)
    .lean()
    .exec();
  const userData = await getUserToProfileMapping(
    files.filter((d) => d.userId).map((d) => d.userId.toString())
  );
  const list = files.map((f) => f._id);
  files = _.keyBy(
    files
      .map((d) => publicFile(d))
      .map((d) => {
        return {
          ...d,
          ...(d.userId ? _.pick(userData[d.userId], ["username", "url"]) : {}),
        };
      }),
    "id"
  );
  res.send({ status: "ok", data: { files, list } });
});
