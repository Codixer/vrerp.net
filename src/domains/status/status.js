import _ from "lodash";
import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { User } from "../users/users.storage.js";
import { HornyStatuses, Status } from "./status.storage.js";
import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";
import { connect } from "../../helpers/connect.js";

const mainGuildId = process.env.MAIN_DISCORD_ID;

async function createUserStatus(where) {
  const userQuery = where.userId ? { _id: where.userId.toString() } : where;
  const user = await User.findOne(userQuery).lean().exec();
  if (!user) {
    return false;
  }
  // using setOnInsert in combination with an undefined Long results in setOnInsert being omitted
  const discordData = _.pick(user, ["discord", "discordId"]);
  const newStatus = await Status.findOneAndUpdate(
    where,
    {
      $setOnInsert: { _id: generateSnowflake() },
      userId: user._id,
      ...discordData,
      guilds: [],
    },
    { upsert: true, new: true }
  );
  return newStatus;
}

export async function getUserStatus(where) {
  let status = await Status.findOne(where).lean().exec();
  if (!status) {
    status = await createUserStatus(where);
    if (!status) {
      return false;
    }
  }
  const guildPresence = status.guilds
    ? status.guilds.map((g) => g.toString())
    : [];
  return {
    status: status.hornyStatus,
    discordPresence: status.guilds && guildPresence.includes(mainGuildId),
  };
}

function calculateStatus(status) {
  if (status.discordStatus === "dnd") {
    return "dnd";
  }
  if (status.hornyStatus === "unavailable") {
    return "unavailable";
  }
  if (status.webStatus === "offline" && status.discordStatus === "offline") {
    return "offline";
  }
  if (
    status.hornyStatus === "online" &&
    status.webStatus === "offline" &&
    status.discordStatus === "idle"
  ) {
    return "idle";
  }
  return status.hornyStatus;
}

export async function addWebClientToUserStatus(where, clientId) {
  let oldStatus = await Status.findOne(where).lean().exec();
  if (
    oldStatus &&
    oldStatus.webClients &&
    oldStatus.webClients.includes(clientId)
  ) {
    return oldStatus.webClients.length;
  }
  await updateUserStatus(where, {
    webStatus: "online",
    $addToSet: { webClients: clientId },
  });
}

export async function removeWebClientFromUserStatus(where, clientId) {
  await updateUserStatus(where, {
    webStatus: "offline",
    $pull: { webClients: clientId },
  });
}

export async function updateUserStatus(where, update, funcUpdate = {}) {
  let oldStatus = await Status.findOne(where).lean().exec();
  if (!oldStatus) {
    if ((oldStatus = await createUserStatus(where)) === false) {
      return false;
    }
  }
  if (update.hornyStatus && update.hornyStatus === "horny") {
    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 4);
    update.hornyExpires = expireDate;
  }
  const displayStatus = calculateStatus(_.merge(oldStatus, update));
  let order = HornyStatuses.indexOf(displayStatus);
  if (order === -1) {
    order = HornyStatuses.indexOf("offline");
  }
  const res = await Status.findOneAndUpdate(
    { _id: oldStatus._id },
    { ...update, ...funcUpdate, displayStatus, order },
    { new: true }
  );
  if (oldStatus && oldStatus.displayStatus !== displayStatus) {
    Events.emit(EventTypes.PROFILE_STATUS_CHANGED, res.userId, {
      displayStatus,
      order,
      hornyStatus: res.hornyStatus,
    });
  }
}

export async function deleteUserStatus(userId) {
  await Status.deleteOne({ userId });
}

export async function expireHornyStatus() {
  console.log("expiring horny statuses");
  const expiredStatuses = await Status.find({
    hornyStatus: "horny",
    $or: [
      { hornyExpires: { $exists: false } },
      { hornyExpires: { $lt: new Date() } },
    ],
  })
    .lean()
    .exec();
  await Promise.all(
    expiredStatuses.map((status) =>
      updateUserStatus({ userId: status.userId }, { hornyStatus: "available" })
    )
  );
  return true;
}

setInterval(expireHornyStatus, 1000 * 60 * 5);

async function reprocessStatus() {
  const p = Array.from(await Status.find().lean().exec());
  while (p.length > 0) {
    console.log(p.length);
    await Promise.all(
      p.splice(0, 100).map(async (t) => {
        const displayStatus = calculateStatus(t);
        const order = HornyStatuses.indexOf(displayStatus);
        await Status.findOneAndUpdate(
          { _id: t._id },
          {
            displayStatus,
            order,
          }
        );
        console.log(t);
      })
    );
    console.log("fin reprocessStatus");
  }
}

if (isMainEntry(import.meta.url)) {
  (async () => {
    await connect();
    if (process.argv.length < 3) {
      console.log("usage: status.js [expire] [reprocess]");
      process.exit(0);
    }
    if (process.argv[2] === "expire") {
      await expireHornyStatus();
    }
    if (process.argv[2] === "reprocess") {
      console.log("reprocessStatus");
      await reprocessStatus();
    }
    process.exit(0);
  })();
}
