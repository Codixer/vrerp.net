import _ from "lodash";
import express from "express";
import { UserFile } from "../files/userFiles.storage.js";
import { deleteFiles, getFilesByIds, publicFile } from "../files/userFiles.js";
import { getUserToProfileMapping } from "../users/profiles.js";
import { createThumbnails } from "../files/images.js";

export const router = express.Router();

export async function getMediaList(filter) {
  const mediaData = await UserFile.find(filter)
    .sort({ _id: -1 })
    .limit(32)
    .lean()
    .exec();
  const userData = await getUserToProfileMapping(
    mediaData.filter((d) => d.userId).map((d) => d.userId.toString())
  );
  const files = _.keyBy(
    mediaData
      .map((d) => publicFile(d))
      .map((d) => {
        return {
          ...d,
          ...(d.userId ? _.pick(userData[d.userId], ["username", "url"]) : {}),
        };
      }),
    "id"
  );
  const list = Object.keys(files);
  return { files, list };
}

router.get("/api/mediawall", async (req, res, next) => {
  const filter = { category: "media" };
  const limit =
    req && req.query && req.query.limit ? parseInt(req.query.limit) : 32;
  if (req.query.lastId) {
    filter._id = { $lt: req.query.lastId };
  }
  res.send({ status: "ok", data: await getMediaList(filter) });
});

router.post("/api/mediawall/files", async (req, res, next) => {
  if (!req.body || !req.body.id) {
    return res.status(400).send({ error: "id required" });
  }
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  const fids = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
  const storeFids = [];
  await Promise.allSettled(
    fids.map(async (fid) => {
      await createThumbnails(fid, ["thumbnail"]);
      storeFids.push(fid);
    })
  );
  const files = await getFilesByIds(storeFids);
  res.send({ status: "ok", data: { files, list: storeFids } });
});

router.delete("/api/mediawall/:fid", async (req, res, next) => {
  if (!req.params.fid) {
    return next();
  }
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  console.log(req.params.fid);
  const file = await UserFile.findOne({ _id: req.params.fid }).lean().exec();
  if (
    !file ||
    (req.user._id.toString() !== file.userId.toString() &&
      !req.user.roles.includes("admin"))
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  await deleteFiles([req.params.fid]);
  res.send({ status: "ok" });
});
