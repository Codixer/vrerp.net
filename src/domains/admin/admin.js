import _ from "lodash";
import express from "express";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { generateSnowflake, publicObject } from "../../helpers/utils.js";
import { User, Profile, Kink } from "../users/users.storage.js";
import { UserFile } from "../files/userFiles.storage.js";
import {
  getProfileList,
  getSchema,
  getUserToProfileMapping,
} from "../users/profiles.js";
import { UserEvent } from "../events/events.storage.js";
import { flushRoleCache, uploadRoles } from "../discord/roles.js";
import { Page } from "../pages/pages.storage.js";
import { refreshPage } from "../pages/pages.js";
import { createAsset } from "../assets/scrape.js";
import { CalendarEventTag } from "../calendar/calendar.storage.js";
import { getCalendarTags } from "../calendar/calendar.js";
import { AssetTag } from "../assets/assets.storage.js";
import { getAssetList, getAssetTags } from "../assets/assets.js";
import { flagUser } from "../reports/reports.js";
import { router as adminReportsRouter } from "./adminReports.js";
import { router as adminProfiles } from "./adminProfiles.js";

export const router = express.Router();

router.use("/api/admin/*", async (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    return res.status(400).send({ error: "access denied" });
  }
  return next();
});

router.use(adminReportsRouter);
router.use(adminProfiles);

router.post("/api/admin/kinks", async (req, res) => {
  await Kink.create({ _id: generateSnowflake(), name: req.body.name });
  await uploadRoles();
  await flushRoleCache();
  res.send({ status: "ok", data: await getSchema() });
});

router.post("/api/admin/calendartags", async (req, res) => {
  await CalendarEventTag.create({
    _id: generateSnowflake(),
    name: req.body.name,
  });
  res.send({ status: "ok", data: await getCalendarTags() });
});

router.post("/api/admin/assettags", async (req, res) => {
  await AssetTag.create({ _id: generateSnowflake(), name: req.body.name });
  res.send({ status: "ok", data: await getAssetTags() });
});

router.get("/api/admin/matches", async (req, res) => {
  let matches = await UserEvent.aggregate([
    { $match: { type: "matched" } },
    { $sort: { updatedAt: -1 } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
  ]).exec();
  matches = matches
    .filter((m) => m.user.length > 0)
    .map((m) => {
      return {
        source: m.parameters.sourceProfileId,
        target: m.user[0].profileId,
        matchDate: m.createdAt,
      };
    });
  const ids = matches
    .reduce((acc, val) => acc.concat([val.source, val.target]), [])
    .filter((v, i, a) => a.indexOf(v) === i);
  res.send({
    status: "ok",
    data: {
      ...(await getProfileList(req, ids, [
        "profile",
        "status",
        "discord",
        "fantasies",
      ])),
      matches,
    },
  });
});

router.post("/api/admin/refresh-guides", async (req, res) => {
  const pages = await Page.find({}).lean().exec();
  await Promise.all(pages.map((p) => refreshPage(p)));
  res.send({ status: "ok" });
});

router.get("/api/admin/assets", async (req, res) => {
  res.send({
    status: "ok",
    data: await getAssetList(req, req.query.query, req.query.lastId, null),
  });
});

router.post("/api/admin/assets", async (req, res) => {
  await createAsset({ url: req.body.url, status: "published" });
  res.send({ status: "ok" });
});
