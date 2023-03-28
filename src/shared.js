import { Store, createPullstateCore } from "pullstate";

export const variantStore = new Store({
  enrolledAt: {},
  variantSet: {},
  goalHit: {},
});

export const siteStore = new Store({
  mode: "development",
  title: "vrerp.net",
  url: "",
  user: {
    isHuman: false,
    ageCheck: false,
    roles: null,
    id: null,
    profileId: null,
    messages: [],
  },
  reported: null,
  pages: {},
  view: {},
});

export const profileStore = new Store({
  schema: [],
  schemaOrder: [],
  profiles: {},
  browseHistory: [],
  fantasies: {},
  fantasyList: [],
  fantasyLikes: {},
  featuredProfileId: null,
  files: {},
  feedList: [],
  matches: [],
  invites: [],
  loves: [],
  invitePending: [],
});

export const mediaStore = new Store({
  imageList: [],
});

export const calendarStore = new Store({
  calendarTags: [],
  calendarEvents: [],
});

export const assetStore = new Store({
  tags: [],
  loadedQuery: null,
  assetList: [],
  assets: {},
  creators: {},
});

export const datesStore = new Store({
  userTimezone: null,
  timezones: [],
  available: [],
  dates: [],
});

export const PullstateCore = createPullstateCore({
  variantStore,
  siteStore,
  profileStore,
  calendarStore,
  assetStore,
  mediaStore,
  datesStore,
});

export const VariantTests = {
  mainTest: ["control", "experiment"],
};

export const complimentTags = [
  "Nice profile",
  "Good phantom sense",
  "Cute avatar",
  "Great cuddles",
  "Nice voice",
  "Cute noises",
  "Nice Moves",
  "Good vibes",
  "Great conversation",
];
export const complimentSpecialTags = ["Succubus"];

export const NOTIFICATION_MATCH = 1;
export const NOTIFICATION_INVITE = 2;

export const getBucketFilename = (file, size) => {
  const fn =
    size === "original"
      ? `original/${file.filename}`
      : `${size}.${file.extension || "png"}`;
  let directory =
    (!file.category || file.category === "profile") &&
    `usermedia/${file.userId}`;
  directory =
    directory || (file.category === "fantasy" && `fantasy/${file.parentId}`);
  directory =
    directory ||
    (file.category === "verification" && `verification/${file.parentId}`);
  directory =
    directory || (file.category === "asset" && `asset/${file.parentId}`);
  directory =
    directory ||
    (file.category === "assetimage" && `assetimage/${file.parentId}`);
  directory = directory || (file.category === "report" && `report`);
  directory = directory || (file.category === "media" && `media`);
  directory = directory || (file.category === "guide" && `guide`);
  return `${directory}/${file._id || file.id}/${fn}`;
};

export const getImageURL = (file, size) => {
  return file
    ? `https://cdn.vrerp.net/${getBucketFilename(file, size)}`
    : `https://cdn.vrerp.net/notfound.png`;
};

export const snowflakeToDate = (snowflake) => {
  const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
  return new Date(dateBits + 1420070400000);
};

export const REPORT_TAGS = {
  major: [
    { name: "underage", value: "Underage (below 18)" },
    { name: "soliciting", value: "Soliciting money for ERP" },
    { name: "spam", value: "Scamming / spamming / troll / bot / malware" },
    { name: "impersonation", value: "Impersonating someone else" },
    { name: "major violation", value: "Something else" },
  ],
  redflag: [
    {
      name: "consent violation",
      value:
        "Consent violation: doing things you haven't agreed upon, and didn't liked; eg: going on after safewords, or photography without consent, etc",
    },
    {
      name: "lying on profile",
      value: "Lying on profile (eg pretending to be fullbody, on desktop)",
    },
    {
      name: "dm policy violation",
      value: "Not respecting DM policy, or spam inviting/harassment",
    },
    { name: "red flag violation", value: "Something else" },
  ],
  yellowdot: [
    { name: "bad roleplay", value: "Bad roleplay / foreplay" },
    {
      name: "lack of effort",
      value: "Lack of effort / communication / reciprocation during ERP",
    },
    { name: "drama", value: "Creating, or feeding drama" },
    { name: "starfish", value: "Not paying attention while in ERP / starfish" },
    { name: "uncomfy", value: "Made you uncomfy" },
    { name: "minor rule violation", value: "Something else" },
  ],
};

export const allRoles = [
  "onboarded",
  "verified",
  "admin",
  "mod",
  "suspended",
  "banned",
  "dates",
  "featured",
  "events",
  "hidden",
];
