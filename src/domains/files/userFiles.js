import _ from "lodash";
import axios from "axios";
import AWS from "aws-sdk";
import express from "express";

import { connect } from "../../helpers/connect.js";
import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { UserFile } from "./userFiles.storage.js";
import { getBucketFilename } from "../../shared.js";

AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
});

export const Bucket = process.env.S3_BUCKET;
const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
});
export const fileRouter = express.Router();

export const download = async (url) => {
  try {
    const res = await axios.get(url, { responseType: "arraybuffer" });
    return res;
  } catch (err) {
    return false;
  }
};

export const publicFile = (data) => {
  return {
    ..._.omit(data, ["_id", "createdAt", "updatedAt", "__v"]),
    id: data["_id"],
  };
};

const extenstionToContentType = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const getContentType = (file) => {
  let ext = file.filename.split(".").splice(-1, 1).join("").toLowerCase();
  if (extenstionToContentType[ext]) {
    return extenstionToContentType[ext];
  }
  ext = file.extension || "png";
  return extenstionToContentType[ext] || null;
};

export const putFile = async (file, Body, altName) => {
  await s3
    .upload({
      Bucket,
      Key: getBucketFilename(file, altName),
      Body,
      ContentType: getContentType(file),
    })
    .promise();
  await UserFile.findOneAndUpdate(
    { _id: file._id },
    { $addToSet: { imageSizes: altName } }
  );
  return true;
};

export const getFilesByIds = async (ids, omit = []) => {
  if (!ids || ids.length === 0 || ids.filter((d) => d).length === 0) {
    return {};
  }
  ids = ids.filter((d) => d);
  const files = await UserFile.find({ _id: { $in: ids } })
    .lean()
    .exec();
  return _.keyBy(
    files.map((f) => {
      return { ..._.omit(f, ["_id", "__v", ...omit]), id: f["_id"] };
    }),
    "id"
  );
};

export const saveFile = async (url, info) => {
  console.log("info", info);
  const result = await download(url);
  if (!result) {
    return false;
  }
  const { data } = result;
  const f = await UserFile.create(info);
  await putFile(f, data, "original");
  return f;
};

fileRouter.post("/api/files/getfiles", async (req, res) => {
  if (!req.body || !req.body.files) {
    return res.status(400).send({ error: "file ids required" });
  }
  const files = await UserFile.find({ _id: { $in: req.body.files } })
    .lean()
    .exec();
  res.send({ status: "ok", data: { files } });
});

fileRouter.post("/api/files/:filename", async (req, res) => {
  if (
    _.get(req, "body.category") !== "verification" &&
    (!req.session || !req.session.userId)
  ) {
    return res.status(400).send({ error: "logged in user required" });
  }
  if (!req.params.filename || !req.body || !req.body.category) {
    return res
      .status(400)
      .send({ error: "filename, and category is required" });
  }
  if (
    ["..", "/", "\\"].filter((c) => req.params.filename.indexOf(c) !== -1)
      .length > 0
  ) {
    return res.status(400).send({ error: "invalid filename" });
  }
  const fid = generateSnowflake();
  const f = await UserFile.create({
    _id: fid,
    userId: req.session.userId,
    parentId: req.body.parentId,
    category: req.body.category,
    filename: req.params.filename,
  });
  const bucketFilename = getBucketFilename(f, "original");
  const url = s3.getSignedUrl("putObject", {
    Bucket,
    ContentType: req.body["type"],
    Key: bucketFilename,
    Expires: 30 * 60 * 1000,
  });
  console.log("url", url);
  res.send({ status: "ok", data: { signedUrl: url, fid } });
});

export const deleteFiles = async (fids) => {
  fids = fids.filter((id) => id);
  if (fids.length === 0) {
    return;
  }
  const files = await UserFile.find({ _id: { $in: fids } })
    .lean()
    .exec();
  await Promise.allSettled(
    files.map(async (f) => {
      const keys = [getBucketFilename(f, "original")].concat(
        f.imageSizes.map((altName) => getBucketFilename(f, altName))
      );
      console.log("deleting s3 objects", keys);
      const res = await s3
        .deleteObjects({
          Bucket,
          Delete: {
            Objects: keys.map((Key) => {
              return { Key };
            }),
          },
        })
        .promise();
    })
  );
  await UserFile.deleteMany({ _id: { $in: fids } });
  return true;
};

if (isMainEntry(import.meta.url)) {
  (async () => {
    console.log("connecting");
    await connect();
    console.log(process.argv);
    if (process.argv.length < 4) {
      console.log("usage: userFiles.js [delete [fileId]]");
      process.exit(0);
    }
    if (process.argv[2] === "delete") {
      const fileId = process.argv[3];
      await deleteFiles([fileId]);
    }

    // const file = new UserFile({ _id: generateSnowflake() });
    // await file.save();
    // console.log(await download('https://api.vrchat.cloud/api/1/file/file_eca5f95c-f720-45f7-9ef2-005d0a8c38e5/1'));

    // const file = await UserFile.findOne({ _id: 'asd' }).lean().exec();
    // const cf = new UserFile({ _id: generateSnowflake() });
    // cf.userId = generateSnowflake();
    // cf.filename = '23';
    // await cf.save();
    // process.exit(0);
    // await deleteFiles(['997025709098610688']);
    console.log("ok");
  })();
}
