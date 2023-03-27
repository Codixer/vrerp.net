import _ from "lodash";
import express from "express";
import { Asset, AssetTag } from "./assets.storage.js";
import { UserFile } from "../files/userFiles.storage.js";
import { getFilesByIds } from "../files/userFiles.js";
import { createAsset, refreshExternalAsset } from "./scrape.js";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";
import { discordLog } from "../discord/bot.js";

export const router = express.Router();

export const getPublicAsset = (data) => {
  return {
    ..._.omit(data, "_id", "__v", "description"),
    id: data["_id"],
    price: data.price ? data.price.toString() : null,
  };
};

const toTtitleCase = (str) =>
  str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();

export const getAssets = async (req, ids) => {
  if (!ids || ids.length === 0) {
    return { assets: {}, files: {} };
  }
  const assetData = await Asset.find({ _id: { $in: ids } })
    .lean()
    .exec();
  const assets = assetData.map((item) => getPublicAsset(item));
  const files = await getFilesByIds(
    assets.map((item) => item.image).filter((item) => item)
  );
  return { assets: _.keyBy(assets, "id"), files };
};

export const getAssetList = async (
  req,
  query,
  lastId,
  status = "published"
) => {
  const filter = {};
  if (status) {
    filter.status = status;
  }
  const limit =
    req && req.query && req.query.limit ? parseInt(req.query.limit) : 32;
  if (lastId) {
    filter._id = { $lt: lastId };
  }
  let queryparts = query
    ? query
        .toLowerCase()
        .split("-")
        .filter((t) => !["vrchat", "erp", "assets"].includes(t))
    : [];
  if (queryparts.includes("free")) {
    filter.price = 0;
    queryparts = queryparts.filter((t) => t !== "free");
  }
  if (queryparts.length > 0) {
    filter.tags = { $all: queryparts.map((q) => toTtitleCase(q)) };
  }
  console.log("filter", filter);
  const assetData = await Asset.find(filter)
    .sort({ _id: -1 })
    .limit(limit)
    .lean()
    .exec();
  // console.log('assetData', assetData);
  const assets = assetData.map((item) => getPublicAsset(item));
  const files = await getFilesByIds(
    assets.map((item) => item.image).filter((item) => item)
  );
  const list = assets.map((d) => d.id);
  return { assets: _.keyBy(assets, "id"), files, list };
};

export async function getAssetTags() {
  const tags = (await AssetTag.find({}).lean().exec()).map((k) => k.name);
  return { tags };
}

router.get("/api/assets/schema", async (req, res, next) => {
  res.send({ status: "ok", data: await getAssetTags() });
});

router.get("/api/assets", async (req, res) => {
  res.send({
    status: "ok",
    data: await getAssetList(req, req.query.query, req.query.lastId),
  });
});

router.post("/api/assets", async (req, res) => {
  if (!req.body || !req.body.url) {
    return res.status(400).send({ error: "url is required" });
  }
  // start scraping asynchronously
  const createParameters = { url: req.body.url, status: "draft" };
  if (req.user.id) {
    createParameters.creatorId = req.user.id;
  }
  createAsset(createParameters);
  discordLog(
    `New asset posted ${req.body.url}\n${process.env.SERVER_URL}admin/assets`
  );
  res.send({ status: "ok" });
});

router.get("/api/assets/:id", async (req, res) => {
  res.send({ status: "ok", data: await getAssets(req, [req.params.id]) });
});

router.post("/api/assets/:id", async (req, res) => {
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  const asset = await Asset.find({ _id: req.params.id }).lean().exec();
  if (!req.user.roles.includes("admin") && req.user.id !== asset.creatorId) {
    return res.status(400).send({ error: "access denied" });
  }
  const update = {};
  if (req.body.tags) {
    update.tags = req.body.tags;
  }
  if (
    req.body.status &&
    ["draft", "published", "deleted"].includes(req.body.status)
  ) {
    update.status = req.body.status;
  }
  await Asset.findOneAndUpdate({ _id: req.params.id }, update);
  res.send({ status: "ok", data: await getAssets(req, [req.params.id]) });
});

router.post("/api/assets/:id/refresh", async (req, res) => {
  console.log("refreshing", req.params.id);
  await refreshExternalAsset(req.params.id);
  res.send({ status: "ok", data: await getAssets(req, [req.params.id]) });
});

router.post("/api/assets/:id/click", async (req, res) => {
  if (!req.params || !req.params.id) {
    return res.status(400).send({ error: "id required" });
  }
  await Asset.findOneAndUpdate({ _id: req.params.id }, { $inc: { clicks: 1 } });
  Events.emit(EventTypes.ASSET_CLICKED, req.user ? req.user.id : null, {
    assetId: req.params.id,
  });
  res.send({ status: "ok" });
});
