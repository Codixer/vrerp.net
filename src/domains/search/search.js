import _ from "lodash";
import express from "express";
import { Kink, Profile } from "../users/users.storage.js";
import {
  getProfileData,
  getProfileList,
  profileSchema,
} from "../users/profiles.js";
import { isMainEntry } from "../../helpers/utils.js";

export const router = express.Router();
const maxItems = 20;

const getSchemaValues = () =>
  Object.keys(profileSchema).reduce((arr, val) => {
    if (!profileSchema[val].values) {
      return arr;
    }
    profileSchema[val].values.forEach((v) => {
      const valstr = typeof v === "string" ? v : v.display;
      const key = valstr.replace(/-/g, "_").split(" ").join("-").toLowerCase();
      arr[key] = val;
    });
    return arr;
  }, {});

const extractExactName = (str) => str.split("-").join(" ").replace(/_/g, "-");

router.get("/api/search", async (req, res, next) => {
  console.log("search", req.query.q);
  const schemaValues = getSchemaValues();
  const filters = [{ profileVisibility: { $in: ["members", "public"] } }];
  let sortingPipeline = [{ $sort: { lastActivity: -1 } }];
  if (req.query.q) {
    const kinks = (await Kink.find({}).lean().exec()).map((k) => k.name);
    const qs = req.query.q
      .split(" ")
      .filter((q) => !["female"].includes(q.toLowerCase()));
    qs.forEach((q) => {
      const qfilters = [];
      if (schemaValues[q.toLowerCase()]) {
        qfilters.push({ [schemaValues[q.toLowerCase()]]: extractExactName(q) });
      }
      if (kinks.includes(extractExactName(q))) {
        qfilters.push({ kinks: extractExactName(q) });
      }
      if (qfilters.length === 2) {
        filters.push({ $or: qfilters });
      } else if (qfilters.length === 1) {
        filters.push(qfilters[0]);
      }
    });
  }
  if (req.query.sort && req.query.sort === "availability") {
    sortingPipeline = [
      {
        $addFields: {
          statusNumeric: {
            $ifNull: [{ $arrayElemAt: ["$status.order", 0] }, 4],
          },
        },
      },
      {
        $addFields: {
          statusOrder: {
            $cond: {
              if: { $eq: ["$statusNumeric", -1] },
              then: 4,
              else: "$statusNumeric",
            },
          },
        },
      },
      { $sort: { statusOrder: 1, lastActivity: -1 } },
    ];
  }
  let filter = { $and: filters };

  console.log("filter", JSON.stringify(filter, 0, 4));

  const ids = await Profile.aggregate([
    {
      $lookup: {
        from: "status",
        localField: "userId",
        foreignField: "userId",
        as: "status",
      },
    },
    { $match: filter },
    ...sortingPipeline,
    { $project: { _id: 1 } },
  ]);
  let list = ids.map((item) => item._id.toString());
  if (req.query.lastId) {
    let cutIndex = list.indexOf(req.query.lastId);
    if (cutIndex === -1) {
      cutIndex = 0;
    }
    list = list.splice(cutIndex, maxItems);
  } else {
    list = list.splice(0, maxItems);
  }
  const data = await getProfileList(req, list, ["status"]);
  data.list = list;
  res.send({ status: "ok", data });
});

if (isMainEntry(import.meta.url)) {
  const keys = getSchemaValues();
  console.log(keys);
}
