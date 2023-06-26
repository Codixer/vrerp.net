import _ from "lodash";
import { Client, Intents } from "discord.js";

import * as Events from "../events/events.js";
import * as EventTypes from "../events/events.types.js";

import { connect } from "../../helpers/connect.js";
import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { getProfile } from "../users/profiles.js";
import { Profile, User } from "../users/users.storage.js";
import { NOTIFICATION_INVITE, NOTIFICATION_MATCH } from "../../shared.js";
import { Guild } from "./discord.storage.js";
import { Verification } from "../verification/verification.storage.js";
import { updateUserStatus } from "../status/status.js";
import { syncMemberRoles } from "./roles.js";

// https://discordjs.guide/popular-topics/intents.html#enabling-intents
// https://discord.com/developers/docs/topics/gateway
export const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_PRESENCES,
    Intents.FLAGS.GUILD_MEMBERS,
  ],
});

export const mainGuildId = process.env.MAIN_DISCORD_ID;
export const mainLogsChannel = process.env.MAIN_LOGS_CHANNEL;

export async function sendMessage(discordId, message) {
  const user = await client.users.fetch(discordId.toString());
  if (user) {
    console.log(
      "sending message to user",
      discordId.toString(),
      user.username,
      message
    );
    try {
      await user.send(message);
    } catch (err) {
      console.warn(
        "failed to send message to user ",
        discordId.toString(),
        user.username
      );
    }
  } else {
    console.warn(
      "failed to find user ",
      discordId.toString(),
      user.username,
      message
    );
  }
}

export async function sendChannel(serverId, channelId, message) {
  console.log("sending message to channel", channelId, message);
  const channel = await client.channels.cache.get(channelId);
  await channel.send(message);
}

export const discordLog = async (message) =>
  sendChannel(mainGuildId, mainLogsChannel, message);

// deprecated, sample calls
async function refreshMembers() {
  // const user = await client.users.fetch('775962752400621609');
  // console.log('user', user);
  // user.send('hi-hi! ');

  const guild = await client.guilds.fetch("1087158851322773525");
  console.log("guild", guild);
  console.log("mem:");
  const members = await guild.members.fetch({ withPresences: true });
  console.log(members.map((m) => m.presence));
  // console.log('members', members);
}

async function inviteNotifications(userId, parameters) {
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user || !user.discordId) {
    return false;
  }
  const userProfile = await Profile.findOne({ _id: user.profileId });
  if (
    !userProfile ||
    !(userProfile.discordNotifications & NOTIFICATION_INVITE)
  ) {
    return false;
  }
  const otherUserProfile = await getProfile(parameters.sourceProfileId);
  await sendMessage(
    user.discordId,
    `${otherUserProfile.username} wants to be your lewdie 💕 ${process.env.SERVER_URL}${otherUserProfile.url}`
  );
}

async function matchNotifications(userId, parameters) {
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user || !user.discordId) {
    return false;
  }
  const userProfile = await Profile.findOne({ _id: user.profileId });
  if (
    !userProfile ||
    !(userProfile.discordNotifications & NOTIFICATION_MATCH)
  ) {
    return false;
  }
  const otherUserProfile = await getProfile(parameters.sourceProfileId);
  await sendMessage(
    user.discordId,
    `Matched with ${otherUserProfile.username} 💖 ${process.env.SERVER_URL}${otherUserProfile.url}`
  );
}

async function approveVerification(userId, parameters) {
  const { discordId } = parameters;
  if (!discordId) {
    return;
  }
  const user = await User.findOne({ discordId }).lean().exec();
  const verification = await Verification.findOne({ discordId })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  let msg = `Your verification has been approved!`;
  if (user) {
    msg += ` You can now chat on VR ERP, and browse for lewdies at ${process.env.SERVER_URL} `;
  } else {
    msg += ` You can now chat on VR ERP, and set up your profile at ${process.env.SERVER_URL} `;
  }
  msg += `. Welcome! 💕`;
  // explicitely enable main vrerp discord
  const enableDiscords = verification.requestedBy.concat("1087158851322773525");
  await Promise.allSettled(
    enableDiscords.map(async (d) => {
      const guild = await Guild.findOne({ discordId: d }).lean().exec();
      const clientGuild = client.guilds.cache.get(d.toString());
      const member = clientGuild.members.cache.get(discordId.toString());
      member.roles.add(guild.verifiedRoleId.toString());
    })
  );
  await sendMessage(discordId, msg);
  if (userId) {
    await syncMemberRoles(userId);
  }
}

async function deniedVerification(userId, parameters) {
  const { discordId, rejectionMessage } = parameters;
  if (!discordId) {
    return;
  }
  const msg = `${rejectionMessage}\nYou can try again by updating your profile, and re-submitting your verification on the site: ${process.env.SERVER_URL} `;
  await sendMessage(discordId, msg);
}

async function suspendedMember(userId, parameters) {
  const user = await User.findOne({ _id: userId }).lean().exec();
  if (!user || !user.discordId || !parameters || !parameters.message) {
    return false;
  }
  await sendMessage(
    user.discordId,
    `Your vrerp.net account has been suspended: ${parameters.message}. You can re-activate it on the site: ${process.env.SERVER_URL} `
  );
}

async function submittedVerification(userId, parameters) {
  const { discordId } = parameters;
  // const admins = await User.find({ roles: { $in: ["mod", "admin"] } })
  //   .lean()
  //   .exec();
  const verification = await Verification.findOne({ discordId })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  //console.log("admins", admins);

  discordLog(
    `<@&1087523024187707493> New ID verification submitted: ${
      process.env.SERVER_URL
    }moderator/verification    ${verification ? verification.discord : ""}`
  );

  // await Promise.all(
  //   admins.map((user) =>
  //     sendMessage(
  //       user.discordId,
  //       `New ID verification submitted: ${
  //         process.env.SERVER_URL
  //       }moderator/verification    ${verification ? verification.discord : ""}`
  //     )
  //   )
  // );
}

client.once("ready", async () => {
  console.log("discord bot ready");
  Events.listen(
    EventTypes.INVITED,
    Events.ListenerType.GLOBAL,
    inviteNotifications
  );
  Events.listen(
    EventTypes.MATCHED,
    Events.ListenerType.GLOBAL,
    matchNotifications
  );
  Events.listen(
    EventTypes.VERIFICATION_APPROVED,
    Events.ListenerType.GLOBAL,
    approveVerification
  );
  Events.listen(
    EventTypes.VERIFICATION_DENIED,
    Events.ListenerType.GLOBAL,
    deniedVerification
  );
  Events.listen(
    EventTypes.VERIFICATION_SUBMITTED,
    Events.ListenerType.GLOBAL,
    submittedVerification
  );
  Events.listen(
    EventTypes.USER_SUSPENDED,
    Events.ListenerType.GLOBAL,
    suspendedMember
  );
});

client.on("presenceUpdate", async (oldMember, newMember) => {
  console.log(
    "member",
    _.get(newMember, "member.user.username"),
    newMember.status
  );
  const discordId = _.get(newMember, "member.user.id");
  if (discordId) {
    await updateUserStatus({ discordId }, { discordStatus: newMember.status });
  }
});

client.on("guildMemberAdd", async (member) => {
  console.log(
    `new member joined ${member.guild.name}: ${_.get(member, "user.username")}`
  );
  const guild = await Guild.findOne({ discordId: member.guild.id })
    .lean()
    .exec();
  console.log("guild", guild);
  if (!guild || !guild.ageVerification || !_.get(member, "user.id")) {
    return;
  }
  const discordId = _.get(member, "user.id");
  const discord = `${member.user.username}`;
  let user = await User.findOne({ discordId }).lean().exec();
  if (user) {
    await syncMemberRoles(user._id);
  }
  await updateUserStatus(
    { discordId },
    { discordStatus: member.status },
    { $addToSet: { guilds: member.guild.id } }
  );
  // await attemptAutoVerification(discordId, discord);
  let verification = await Verification.findOne({ discordId })
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
  if (verification) {
    if (verification.status === "verified") {
      console.log(`member ${_.get(member, "user.username")} verified already`);
      member.roles.add(guild.verifiedRoleId.toString());
      return true;
    } else if (verification.status === "banned") {
      console.log(`member ${_.get(member, "user.username")} banned`);
      return true;
    }
    console.log("verification exists already", verification);
  } else {
    verification = await Verification.create({
      _id: generateSnowflake(),
      discordId,
      discord: `${member.user.username}`,
      requestedBy: [member.guild.id],
      status: "draft",
    });
    console.log("new verification", verification);
  }
  const link = `${process.env.SERVER_URL}verify/${verification._id}`;
  await sendMessage(
    discordId,
    `Hi-hi, welcome to horny 🤗 We're a site dedicated to erp matchmaking ( https://vrerp.net/ ), and a discord community for flirting, meeting new lewdies💕, events, and more!
• If you're new to vr erp, read kitten's guide to cuddles: https://vrerp.net/VRC-Kama-Sutra-or-kittens-guide-to-cuddles
• Most of our channels are behind age verification -this is to make sure everyone here is comfy to play with 😊 
To join the server, and verify your account, please register on the site using your discord: https://vrerp.net/
Have lotsa fun 💕💕💕
-The lewd admins`
  );
});

client.on("guildMemberRemove", async (member) => {
  console.log(
    `member left ${member.guild.name}: ${_.get(member, "user.username")}`
  );
  const guild = await Guild.findOne({ discordId: member.guild.id })
    .lean()
    .exec();
  if (!guild || !guild.ageVerification || !_.get(member, "user.id")) {
    return;
  }
  const discordId = _.get(member, "user.id");
  await updateUserStatus(
    { discordId },
    { discordStatus: "offline" },
    { $pull: { guilds: member.guild.id } }
  );
});

// client.on('guildMemberUpdate', async (oldMemeber, newMemeber) => {
//     const guild = await Guild.findOne({ discordId: newMemeber.guild.id }).lean().exec();
//     console.log('guild', guild);
//     if ((!guild) || (!guild.ageVerification) || (!_.get(newMemeber, 'user.id'))) {
//         return;
//     }
//     console.log('oldmember', oldMemeber.roles);
//     console.log('newmember', newMemeber.roles);
// });

export async function initBot() {
  console.log("initbot");
  client.login(process.env.DISCORD_BOT_TOKEN);
}

if (isMainEntry(import.meta.url)) {
  (async () => {
    initBot();
  })();
}
