// syncs roles between site, and discord server

import { GuildMember, SystemChannelFlags } from "discord.js";
import _ from "lodash";
import pLimit from "p-limit";
import { connect } from "../../helpers/connect.js";
import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { complimentSpecialTags, complimentTags } from "../../shared.js";
import { updateUserStatus } from "../status/status.js";
import { profileSchema } from "../users/profiles.js";
import { Kink, Profile, User } from "../users/users.storage.js";
import { Verification } from "../verification/verification.storage.js";
import { client, initBot } from "./bot.js";
import { DiscordRole, Guild } from "./discord.storage.js";

const guildId = process.env.MAIN_DISCORD_ID;
const alwaysPresentTags = [
  "◼ 𝗣𝗘𝗥𝗦𝗢𝗡𝗔𝗟 𝗜𝗡𝗙𝗢ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗩𝗥 𝗦𝗘𝗧𝗨𝗣ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗘𝗥𝗣 𝗜𝗡𝗙𝗢ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗞𝗜𝗡𝗞𝗦ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗗𝗠 𝗦𝗧𝗔𝗧𝗨𝗦ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗣𝗜𝗡𝗚𝗦ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
  "◼ 𝗠𝗘𝗠𝗕𝗘𝗥𝗦ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
];
const remarkedTag = "◼ 𝗥𝗘𝗠𝗔𝗥𝗞𝗘𝗗 𝗙𝗢𝗥ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ";
const otherRoles = [remarkedTag];

export async function uploadRoles() {
  const clientGuild = client.guilds.cache.get(guildId);
  // console.log('clientGuild', clientGuild);
  const discordRoles = clientGuild.roles.cache.sort(
    (a, b) => b.position - a.position
  );
  const serverRoles = await DiscordRole.find({ guildId }).lean().exec();
  let allTags = Object.values(profileSchema).reduce((arr, section) => {
    return arr.concat(
      section.values
        ? section.values.map((item) => (_.isObject(item) ? item.display : item))
        : []
    );
  }, []);
  const kinks = (await Kink.find({}).lean().exec()).map((k) => k.name);
  allTags = allTags.concat(kinks);
  allTags = allTags.concat(alwaysPresentTags);
  allTags = allTags.concat(otherRoles);
  allTags = allTags.concat(complimentTags);
  allTags = allTags.concat(complimentSpecialTags);
  const discordExistingRoles = Array.from(discordRoles.values()).map(
    (role) => role.name
  );
  console.log(JSON.stringify(discordExistingRoles));
  const discordMissingRoles = allTags.filter(
    (t) => !discordExistingRoles.includes(t)
  );
  console.log("discordMissingRoles", discordMissingRoles);
  Promise.allSettled(
    discordMissingRoles.map(async (tag) => {
      const role = await discordRoles.filter((r) => r.name == tag);
      if (role.size > 0) {
        console.log("found " + tag + " - " + Array.from(role)[0][1].id);
        const rId = Array.from(role)[0][1].id;
        console.log(serverRoles.filter((r) => r.tag == tag).length == 0);
        if (serverRoles.filter((r) => r.tag == tag).length == 0) {
          await DiscordRole.create({
            _id: generateSnowflake(),
            tag,
            roleId: rId,
            guildId,
          });
          console.log(
            tag + " did not exist in database, added it to database. Under "
          );
        } else {
          console.log(tag + " exists in database.");
        }

        console.log(k);
      } else {
        const newrole = await clientGuild.roles.create({
          name: tag,
          mentionable: false,
          hoist: false,
        });
        const k = await DiscordRole.create({
          _id: generateSnowflake(),
          tag,
          roleId: newrole.id,
          guildId,
        });
        console.log("Created and bound role in database to " + tag);
      }
    })
  );
  console.log("role sync finished");
  // console.log('role', role);
}

let roleCache = {};

async function rereadRoleCache() {
  const roles = await DiscordRole.find({ guildId }).lean().exec();
  console.log(roles);
  roleCache = roles.reduce((arr, item) => {
    arr[item.tag] = item.roleId;
    return arr;
  }, {});
  const guild = await Guild.findOne({ discordId: guildId }).lean().exec();
  if (guild) {
    roleCache["Verified 18+"] = guild.verifiedRoleId;
  }
}

export async function flushRoleCache() {
  roleCache = {};
}

async function deleteServerRoles() {
  const clientGuild = client.guilds.cache.get(guildId);
  const roles = await DiscordRole.find({ guildId }).lean().exec();
  const res = await Promise.allSettled(
    roles.map(async (role) => {
      return Promise.all([
        clientGuild.roles.delete(role.roleId.toString()),
        DiscordRole.findByIdAndRemove(role._id),
      ]);
    })
  );
  console.log(res);
}

export async function syncMemberRoles(userId) {
  await rereadRoleCache();
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user) {
    console.error(`Unknown user while syncMemberRoles: ${userId}`);
    return false;
  }
  if (!user.discordId) {
    return false;
  }
  const profile = await Profile.findOne({ _id: user.profileId }).lean().exec();
  const verification = await Verification.findOne({
    $or: [{ userId }, { discordId: user.discordId }],
  })
    .lean()
    .exec();
  const verified =
    (user.roles.includes("verified") && !user.roles.includes("banned")) ||
    (verification && verification.status === "verified");
  console.log(
    `updating member ${profile.discord} (${user.discordId}) on discord (${
      verified ? "verified" : "non-verified"
    }): `
  );
  const clientGuild = client.guilds.cache.get(guildId);
  const member = clientGuild.members.cache.get(user.discordId.toString());
  if (!member) {
    console.log(`member ${profile.discord} not on discord`);
    return false;
  }
  let allProfileTags = [];
  if (verified) {
    allProfileTags = Object.keys(profileSchema).reduce(
      (arr, item) => arr.concat(profile[item] ? profile[item] : []),
      []
    );
    allProfileTags.push("Verified 18+");
    allProfileTags = allProfileTags.concat(alwaysPresentTags);
  }
  const allowedExtraTags = [
    "@everyone",
    "servants",
    "early access",
    "Server Booster",
    "Advisor",
    "Event Host",
    "Moderator",
    "Temp Staff",
    "Verifier",
    "Admin",
    "Head Staff",
    "◼ 𝗦𝗧𝗔𝗙𝗙ㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤㅤ",
    "Trial Mod",
    "Moderation Team",
    "Event Manager",
    "Event Organiser",
    "Webmestre",
    "Technical Team",
    "Event Team",
  ];
  if (profile.compliments && Object.keys(profile.compliments).length > 0) {
    allProfileTags.push(remarkedTag);
    allProfileTags = allProfileTags.concat(
      Object.keys(profile.compliments).filter(
        (key) => profile.compliments[key].length > 0
      )
    );
  }
  const existingTags = member.roles.cache
    .sort((a, b) => b.position - a.position)
    .map((r) => r.name);
  const missingTags = allProfileTags.filter((t) => !existingTags.includes(t));
  const extraTagsToRemove = existingTags.filter(
    (t) => !(allProfileTags.includes(t) || allowedExtraTags.includes(t))
  );
  console.log("missingTags", missingTags);
  console.log("extraTagsToRemove", extraTagsToRemove);
  let rolesAdd = [];
  let rolesRemove = [];
  await Promise.all(
    missingTags.map((t) => {
      console.log(`Info: ${t}`);

      let ro = clientGuild.roles.cache.find((r) => r.name === t);
      if (ro == null) {
        console.log(
          `Requested role ${t.toString()} could not found on the server (what).`
        );
        return;
      }

      rolesAdd.push(ro);
    })
  );
  await Promise.all(
    extraTagsToRemove.map((t) => {
      console.log(`Info: ${t}`);

      let ro = clientGuild.roles.cache.find((r) => r.name === t);
      if (ro == null) {
        console.log(
          `Requested role ${t.toString()} could not found on the server (what).`
        );
        return;
      }

      rolesRemove.push(ro);
    })
  );

  console.log("rolesAdd", rolesAdd);
  console.log("rolesRemove", rolesRemove);

  await member.roles.add(rolesAdd);
  await member.roles.remove(rolesRemove);
  console.log("Added all roles");
}

async function syncAllMemberRoles() {
  let mem = 0;
  const clientGuild = await client.guilds.fetch(guildId);
  const premembers = await clientGuild.members.fetch();
  const members = premembers
    .map((m) => (m.user && m.user.id ? m.user.id : null))
    .filter((id) => id);
  const limit = pLimit(5);
  await Promise.all(
    members.map((discordId) =>
      limit(async () => {
        const user = await User.findOne({ discordId }).lean().exec();
        if (!user) {
          console.error(`Unknown user while syncMemberRoles: ${discordId}`);
          mem++;
          return false;
        }
        await syncMemberRoles(user._id);
      })
    )
  );
  console.log(members);
}

async function syncMemberStatus() {
  const clientGuild = client.guilds.cache.get(guildId);
  const members = clientGuild.members.cache
    .map((m) => (m.user && m.user.id ? m.user.id : null))
    .filter((id) => id);
  const limit = pLimit(5);
  await Promise.all(
    clientGuild.members.cache.map((member) =>
      limit(async () => {
        if (!member.user || !member.user.id) {
          return;
        }
        const discord = `${member.user.username}`;
        console.log(discord);
        await updateUserStatus(
          { discordId: member.user.id },
          { discordStatus: member.presence.status, discord },
          { $addToSet: { guilds: guildId } }
        );
      })
    )
  );
  console.log("member status syncd");
}

async function syncMember(str) {
  const filter = new RegExp(str, "i");
  const profiles = await Profile.find({
    $or: [
      { _id: str },
      { username: filter },
      { discord: filter },
      { vrchat: filter },
      { url: filter },
    ],
  })
    .select(["userId", "username"])
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  await profiles.map(async (p) => {
    console.log(`syncing member ${p.username}`);
    await syncMemberRoles(p.userId);
  });
}

async function unverifiedRole() {
  // Go through all discord members in the main guild and check if they have the 'Verified 18+' role. If they don't, give them the 'Unverified' role.
  const clientGuild = await client.guilds.fetch(process.env.MAIN_DISCORD_ID);
  const members = await clientGuild.members.fetch();
  const verifiedRole = clientGuild.roles.cache.find(
    (l) => l.name === "Verified 18+"
  );
  const unverifiedRole = clientGuild.roles.cache.find(
    (l) => l.name === "UNVERIFIED"
  );
  let count = 0;
  let count2 = 0;
  let count3 = 0;
  let count4 = 0;

  for (const [key, member] of members) {
    // Check if the member is a bot
    if (member.user.bot) continue;

    //console.log(member.displayName + " has roles: " + member.roles.cache.size);

    if (
      member.roles.cache.has(verifiedRole.id) &&
      member.roles.cache.has(unverifiedRole.id)
    ) {
      //await member.roles.remove(unverifiedRole);
      //console.log("Removed unverified role from " + member.displayName);
      count4++;
    }

    if (!member.roles.cache.has(verifiedRole.id)) {
      //await member.roles.add(unverifiedRole);
      //console.log("Added no 18+ role to " + member.displayName);
      count2++;
    }

    if (member.roles.cache.size === 1) {
      //await member.roles.add(unverifiedRole);
      //console.log("Added no roles role to " + member.displayName);
      count3++;
    }

    count++;
  }
  console.log("Total members: " + count);
  console.log("Total members with no 18+ role: " + count2);
  console.log("Total members with no roles: " + count3);
  console.log("Total members with both roles: " + count4);
}

if (isMainEntry(import.meta.url)) {
  (async () => {
    await connect();
    initBot();
    client.once("ready", async () => {
      console.log(process.argv);
      if (process.argv.length < 3) {
        console.log(
          "usage: roles.js [refresh | members | status | reset | member]"
        );
        process.exit(0);
      }
      if (process.argv[2] === "refresh") {
        console.log("uploading roles");
        await uploadRoles();
      } else if (process.argv[2] === "members") {
        await syncAllMemberRoles();
      } else if (process.argv[2] === "reset") {
        await deleteServerRoles();
      } else if (process.argv[2] === "status") {
        await syncMemberStatus();
      } else if (process.argv[2] === "member") {
        await syncMember(process.argv[3]);
      } else if (process.argv[2] === "unverified") {
        await unverifiedRole(process.argv[2]);
      }
    });
  })();
}
