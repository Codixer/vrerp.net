import _ from "lodash";
import express from "express";

import { fullAccess, isMainEntry } from "../../helpers/utils.js";
import { deleteFiles } from "../files/userFiles.js";
import {
  generateThumbnail,
  generateBanner,
  createThumbnails,
} from "../files/images.js";
import { UserFile } from "../files/userFiles.storage.js";
import { User, Kink, Profile } from "./users.storage.js";
import { usernameToURL, validateUsername } from "./usernames.js";
import { getMatchDB } from "../matching/matching.js";
import {
  complimentSpecialTags,
  complimentTags,
  getBucketFilename,
} from "../../shared.js";
import { getFantasies, getProfileFantasies } from "../fantasies/fantasies.js";
import { Status } from "../status/status.storage.js";
import mongoose from "mongoose";
import { syncMemberRoles } from "../discord/roles.js";
import { getAssets } from "../assets/assets.js";
// import { hasDatesSetup } from '../dates/dates.js';

const { mongo } = mongoose;

export const router = express.Router();

export const profileSchema = {
  gender: {
    description: "What's your gender?",
    values: [
      "Male",
      "Female",
      "Trans MtF",
      "Trans FtM",
      "Gender Fluid",
      "Non-Binary",
      "Gender Other",
    ],
  },
  orientation: {
    description: "What's your sexual orientation?",
    values: [
      "Straight",
      "Gay",
      "Lesbian",
      "Bisexual",
      "Pansexual",
      {
        value: "Finsexual",
        display: "Straight+ (Finsexual)",
        description: "For those willing to erp with Trap, Femboi and Trans",
      },
      "Demisexual",
      "Orientation Exploring",
    ],
  },
  presents: { values: ["Femboy", "Tomboy", "Furry", "Futa"] },
  pronouns: { values: ["He/Him", "She/Her", "They/Them", "Other Pronouns"] },
  age: {
    description: "What's your age?",
    values: ["18-20", "21-24", "25-28", "29-32", "33+"],
  },
  region: {
    description: "Which region are you from?",
    values: [
      "North America",
      "Japan",
      "South America",
      "Western Europe",
      "Eastern Europe",
      "Australia & New-Zealand",
      "Asia",
      "Africa",
    ],
  },
  setup: {
    description:
      'What setup are you using? (pc-linked Quest is PCVR; standalone is "quest only")',
    values: ["Desktop", "Quest only", "PCVR", "Fullbody"],
  },
  vrother: {
    description: "Other important things about you?",
    values: ["Creator", "Phantom Sense", "Mute", "Partial Mute"],
  },
  erproles: {
    description: "How often do you ERP?",
    values: [
      "Never ERP Before",
      "New to ERP",
      "Rarely ERP",
      "Regular ERP",
      "ERP Often",
    ],
  },
  domsub: {
    values: [
      { value: "Dom", display: "Dominant" },
      { value: "Sub", display: "Submissive" },
      { value: "Switch", display: "Switch" },
    ],
  },
  toys: { values: ["Lovense"] },
  kinks: {
    description: "What are your darkest desires you want furfilled?",
    values: [
      "Anal",
      "Ageplayer",
      "Ageplayer (little)",
      "Brat",
      "Breath Play",
      "Brat Tamer",
      "Bondage",
      "Daddy/Mommy",
      "Degradee",
      "Experimentalist",
      "Exhibitionist",
      "Femdom",
      "Masochist",
      "Primal (Prey)",
      "Rope Bunny",
      "Pet",
      "Denied",
      "Master/Mistress",
      "Romance-Affection",
      "Slave",
      "Sadist",
      "Feet",
      "Furry",
      "Hypnosis",
      "Hypnotist",
      "Hypnosis (subject)",
      "Leather",
      "Latex",
      "Noncon",
      "Pet Owner",
      "Primal (Hunter)",
      "Rigger",
      "Slave Owner",
      "Cuckolded",
      "Tentacles",
      "Voyeur",
      "Vore",
      "Vanilla",
      "Watersports",
    ],
  },
  directmessages: {
    description: "What's your DM policy on Discord?",
    values: ["DM Open", "DM Matches Only", "DM Ask First", "DM Closed"],
  },
  discordcolor: {
    description: "What color would you like to use on Discord?",
    values: [
      "🎀 Pink",
      "💚 Green",
      "🧡 Orange",
      "💜 Purple",
      "💧 Cyan",
      "💙 Blue",
      "❤️ Red",
      "💛 Yellow",
      "🌸 Magenta",
      "🖤 Black",
      "🤍 White",
    ],
  },
  discordpings: {
    description: "Receive Discord notifications for:",
    values: ["Event Ping", "Updates Ping"],
  },
};

export const getSchema = async () => {
  const kinks = (await Kink.find({}).sort({ frequency: -1 }).lean().exec()).map(
    (k) => k.name
  );
  return {
    schema: { ...profileSchema, kinks: { values: kinks } },
    schemaOrder: Object.keys(profileSchema),
  };
};

export const getProfileData = async (req, profile, allow = []) => {
  profile = { ..._.omit(profile, ["__v", "_id"]), id: profile["_id"] };
  if (["banned", "suspended"].includes(profile.profileVisibility)) {
    return { profileVisibility: "disabled", id: profile.id };
  }
  if (profile.userId) {
    const profileUser = await User.findOne({ _id: profile.userId })
      .lean()
      .exec();
    profile.discordId = _.get(profileUser, "discordId");
  }
  const isOwn =
    req &&
    req.user &&
    req.user.profileId &&
    req.user.profileId.toString() === profile.id.toString();
  const isMatch =
    req && req.user && req.user.profileId
      ? (await getMatchDB(profile.id, "matches")).includes(
          req.user.profileId.toString()
        )
      : false;
  const hasAccess = (required) => {
    if (isOwn) {
      return true;
    }
    if (!req || !req.user || !req.user.profileId || !fullAccess(req.user)) {
      return required === "public";
    }
    return required === "matches" ? isMatch : true;
  };
  if (isMatch || isOwn || allow.includes("status")) {
    if (profile.status) {
      if (Array.isArray(profile.status)) {
        profile.status = _.get(profile, "status.0.displayStatus");
      }
    } else {
      const status = Status.findOne({ userId: profile.userId }).lean().exec();
      if (status) {
        profile.status = status.displayStatus;
      }
    }
  } else if (profile.status) {
    delete profile.status;
  }
  if (!hasAccess(profile.profileVisibility) && !allow.includes("profile")) {
    return null;
  }
  if (!hasAccess(profile.discordVisibility) && !allow.includes("discord")) {
    profile = {
      ..._.omit(profile, [
        "userId",
        "vrchat",
        "chilloutvr",
        "discord",
        "discordId",
      ]),
    };
  }
  const fantasies = await getProfileFantasies(profile.id);
  if (hasAccess(profile.fantasiesVisibility) || allow.includes("fantasies")) {
    profile.fantasies = fantasies;
  } else {
    profile.fantasies = { count: fantasies.count };
  }
  // if (hasAccess(profile.datesVisibility) || allow.includes('dates')) {
  //     profile.allowDates = await hasDatesSetup(profile.userId);
  // }
  return profile;
};

export const getProfile = async (id) =>
  await Profile.findOne({ _id: id }).lean().exec();

export const getProfileFiles = async (profile) => {
  let fids = [];
  if (
    profile === null ||
    (!Array.isArray(profile) &&
      typeof profile === "object" &&
      Object.keys(profile).length === 0)
  ) {
    return [];
  }
  const filesInProfile = (p) =>
    (p.files ? p.files : []).concat(p.avatar ? p.avatar : null);
  if (Array.isArray(profile)) {
    fids = _.flatten(profile.filter((p) => p).map((p) => filesInProfile(p)));
  } else {
    fids = filesInProfile(profile);
  }
  const files = await UserFile.find({ _id: { $in: fids } })
    .lean()
    .exec();
  return _.keyBy(
    files.map((f) => {
      return { ..._.omit(f, "_id", "__v"), id: f["_id"] };
    }),
    "id"
  );
};

const indexWithNullValues = (data, key, values) => {
  return {
    ...values.reduce((arr, val) => {
      arr[val] = null;
      return arr;
    }, {}),
    ..._.keyBy(data, key),
  };
};

export const getProfileList = async (req, ids, allow = []) => {
  const profileData = await Profile.aggregate([
    {
      $match: {
        _id: { $in: ids.map((id) => mongo.Long.fromString(id.toString())) },
      },
    },
    {
      $lookup: {
        from: "status",
        localField: "userId",
        foreignField: "userId",
        as: "status",
      },
    },
  ]).exec();
  const profiles = (
    await Promise.all(profileData.map((p) => getProfileData(req, p, allow)))
  ).filter((p) => p);
  const profileFiles = await getProfileFiles(profiles);
  const profileFantasies = profiles
    .reduce(
      (acc, p) =>
        acc
          .concat(_.get(p, "fantasies.love"))
          .concat(_.get(p, "fantasies.trial")),
      []
    )
    .filter((p) => p);
  const { fantasies, files: fantasyFiles } = await getFantasies(
    profileFantasies
  );
  const profileAssets = profiles
    .reduce((acc, p) => acc.concat(_.get(p, "wishlist")), [])
    .filter((id) => id);
  const { assets, files: assetFiles } = await getAssets(req, profileAssets);
  return {
    profiles: indexWithNullValues(profiles, "id", ids),
    fantasies,
    files: { ...profileFiles, ...fantasyFiles, ...assetFiles },
    assets,
  };
};

export const deleteProfile = async (id) => {
  const profile = await Profile.findOne({ _id: id }).lean().exec();
  if (!profile) {
    throw new Error(`profile id ${id} not found`);
  }
  console.log(profile.files);
  const files = [profile.avatar, ...profile.files].filter((f) => f);
  console.log("files", files);
  await deleteFiles(files);
  await Profile.deleteOne({ _id: id });
  return true;
};

export const getUserToProfileMapping = async (userIds) => {
  const profiles = await Profile.find({ userId: { $in: userIds } })
    .select(["id", "url", "username", "userId"])
    .lean()
    .exec();
  return _.keyBy(profiles, "userId");
};

router.get("/api/profiles/schema", async (req, res, next) => {
  res.send({ status: "ok", data: await getSchema() });
});

// this page is public, restrictions are applied via getProfileData
router.get("/api/profiles/:id", async (req, res, next) => {
  if (!req.params.id) {
    return next();
  }
  const profileData = await getProfileList(req, [req.params.id]);
  if (Object.keys(profileData.profiles) === 0) {
    return res.status(404).send({ status: "error", error: "notfound" });
  }
  profileData.profile = Object.values(profileData.profiles)[0];
  delete profileData.profiles;
  res.send({ status: "ok", data: profileData });
});

router.post("/api/profilelist", async (req, res, next) => {
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (!req.body || !req.body.ids) {
    return res.status(400).send({ error: "ids required" });
  }
  res.send({ status: "ok", data: await getProfileList(req, req.body.ids) });
});

router.post("/api/profiles/:id", async (req, res, next) => {
  if (!req.params.id) {
    return next();
  }
  if (!req.body) {
    return res.status(400).send({ error: "update required" });
  }
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (
    req.user.profileId.toString() !== req.params.id &&
    !req.user.roles.includes("admin")
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  let profile = await Profile.findOne({ _id: req.params.id }).exec();
  if (!profile) {
    return res.status(404).send({ error: "profile not found" });
  }
  if (req.body.username) {
    let error = null;
    console.log(
      "validate error",
      await validateUsername(req.body.username, req.params.id)
    );
    if (
      (error = await validateUsername(req.body.username, req.params.id)) !==
      null
    ) {
      console.log("error", error);
      return res.status(400).send({ error });
    }
    req.body.url = usernameToURL(req.body.username);
  }
  // validate update
  const updateErrors = Object.keys(req.body).filter((key) => {
    return (
      !Object.keys(Profile.schema.paths)
        .concat(Object.keys(profileSchema))
        .includes(key) ||
      ["_id", "_v", "updatedAt", "createdAt", "userId"].includes(key)
    );
  });
  if (updateErrors.length > 0) {
    return res
      .status(400)
      .send({ error: `invalid value for ${updateErrors.join(" ")}` });
  }
  if (req.body.avatar) {
    await createThumbnails(req.body.avatar, ["thumbnail", "banner"]);
  }
  profile = await Profile.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    { new: true }
  )
    .lean()
    .exec();
  res.send({
    status: "ok",
    data: {
      profile: await getProfileData(req, profile),
      files: await getProfileFiles(profile),
    },
  });
});

router.post("/api/profiles/:profileId/files", async (req, res, next) => {
  if (!req.params.profileId) {
    return next();
  }
  if (!req.body || !req.body.id) {
    return res.status(400).send({ error: "id required" });
  }
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (
    req.user.profileId.toString() !== req.params.profileId &&
    req.user.roles.includes("admin")
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  const fids = Array.isArray(req.body.id) ? req.body.id : [req.body.id];
  const storeFids = [];
  await Promise.allSettled(
    fids.map(async (fid) => {
      await createThumbnails(fid, ["thumbnail"]);
      storeFids.push(fid);
    })
  );
  const profile = await Profile.findOneAndUpdate(
    { _id: req.params.profileId },
    { $push: { files: storeFids } },
    { new: true }
  )
    .lean()
    .exec();
  res.send({
    status: "ok",
    data: {
      profile: await getProfileData(req, profile),
      files: await getProfileFiles(profile),
    },
  });
});

router.delete("/api/profiles/:profileId/files/:fid", async (req, res, next) => {
  if (!req.params.profileId || !req.params.fid) {
    return next();
  }
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (
    req.user.profileId.toString() !== req.params.profileId &&
    !req.user.roles.includes("admin")
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  const file = await UserFile.findOne({ _id: req.params.fid }).lean().exec();
  if (
    !file ||
    (req.user._id.toString() !== file.userId.toString() &&
      !req.user.roles.includes("admin"))
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  const profile = await Profile.findOneAndUpdate(
    { _id: req.params.profileId },
    { $pull: { files: req.params.fid } },
    { new: true }
  )
    .lean()
    .exec();
  await deleteFiles([req.params.fid]);
  res.send({
    status: "ok",
    data: {
      profile: await getProfileData(req, profile),
      files: await getProfileFiles(profile),
    },
  });
});

router.post("/api/profiles/:profileId/compliments", async (req, res) => {
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (
    !req.params.profileId ||
    !req.body ||
    !req.body.tags ||
    !Array.isArray(req.body.tags)
  ) {
    return res.status(400).send({ error: "profileId, and tags required" });
  }
  const invalidTags = req.body.tags.filter(
    (t) => !complimentTags.includes(t) && !complimentSpecialTags.includes(t)
  );
  if (invalidTags.length > 0) {
    return res.status(400).send({ error: "invalid tags", tags: invalidTags });
  }
  const isMatch = (await getMatchDB(req.params.profileId, "matches")).includes(
    req.user.profileId.toString()
  );
  if (!isMatch) {
    return res.status(400).send({ error: "not a match" });
  }
  const added = req.body.tags.reduce((arr, val) => {
    arr[`compliments.${val}`] = req.user.profileId;
    return arr;
  }, {});
  const removed = complimentTags
    .concat(complimentSpecialTags)
    .filter((t) => !req.body.tags.includes(t))
    .reduce((arr, val) => {
      arr[`compliments.${val}`] = req.user.profileId;
      return arr;
    }, {});
  const profile = await Profile.findOneAndUpdate(
    { _id: req.params.profileId },
    { $addToSet: added, $pull: removed },
    { new: true }
  )
    .lean()
    .exec();
  await syncMemberRoles(profile.userId);
  res.send({
    status: "ok",
    data: {
      profile: await getProfileData(req, profile),
      files: await getProfileFiles(profile),
    },
  });
});

router.post("/api/profiles/:profileId/wishlist", async (req, res) => {
  if (!req.user || !req.user.roles) {
    return res.status(400).send({ error: "please log in" });
  }
  if (!req.params.profileId || !req.body || !req.body.id) {
    return res.status(400).send({ error: "profileId required" });
  }
  if (
    req.user.profileId.toString() !== req.params.profileId &&
    !req.user.roles.includes("admin")
  ) {
    return res.status(400).send({ error: "invalid profile editing" });
  }
  let profile = await Profile.findOne({ _id: req.params.profileId })
    .lean()
    .exec();
  if (!profile) {
    return res.status(400).send({ error: "invalid profileId" });
  }
  let update = {};
  if (
    profile.wishlist &&
    profile.wishlist.map((w) => w.toString()).includes(req.body.id)
  ) {
    update = { $pull: { wishlist: req.body.id } };
  } else {
    update = { $addToSet: { wishlist: req.body.id } };
  }
  profile = await Profile.findOneAndUpdate(
    { _id: req.params.profileId },
    update,
    { new: true }
  )
    .lean()
    .exec();
  res.send({
    status: "ok",
    data: { profile: await getProfileData(req, profile) },
  });
});

if (isMainEntry(import.meta.url)) {
  console.log(Object.keys(Profile.schema.paths));
  // console.log(getSchema());
}
