import _ from "lodash";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { default as findConfig } from "find-config";
dotenv.config({ path: findConfig(".env") });

import { fileURLToPath } from "url";

export function isMainEntry(url) {
  return fileURLToPath(url) === process.argv[1];
}

let inc = 0;
let lastSnowflakeRoot;
const dcloneEpoch = 1420070400000;
const workerId = parseInt(process.env.WORKERID || 0);

export function generateSnowflake() {
  const pad = (num, by) => num.toString(2).padStart(by, "0");
  const msSince = pad(new Date().getTime() - dcloneEpoch, 42);
  const pid = pad(process.pid, 5).slice(0, 5);
  const wid = pad(workerId || 0, 5);
  const getInc = (add) => pad(add, 12);

  const currentRoot = `0b${msSince}${wid}${pid}`;
  if (currentRoot === lastSnowflakeRoot) {
    inc++;
  } else {
    inc = 0;
    lastSnowflakeRoot = currentRoot;
  }
  let snowflake = `0b${msSince}${wid}${pid}${getInc(inc)}`;
  return BigInt(snowflake).toString();
}

export const publicObject = (data) => {
  return data
    ? {
        ..._.omit(data, ["_id", "createdAt", "updatedAt", "__v"]),
        id: data["_id"],
      }
    : null;
};

export const fullAccess = (user) =>
  user &&
  user.profileId &&
  user.roles &&
  user.roles.includes("verified") &&
  user.roles.includes("onboarded");

if (isMainEntry(import.meta.url)) {
  console.log(fileURLToPath(import.meta.url));
  let arr = [];
  let maxinc = 0;
  for (var i = 0; i < 100000; i++) {
    arr.push(generateSnowflake());
    if (inc > maxinc) {
      maxinc = inc;
    }
  }
  const deduplicated = Array.from(new Set(arr));
  if (deduplicated.length !== arr.length) {
    console.log("snowflake not unique", deduplicated.length);
    console.log(arr);
  }
  console.log(arr, maxinc);
}
