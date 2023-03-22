
import _ from 'lodash';
import { Client, Intents } from 'discord.js';
import { connect } from '../../helpers/connect.js';

import { generateSnowflake, isMainEntry } from "../../helpers/utils.js";
import { User } from '../users/users.storage.js';
import { Verification } from '../verification/verification.storage.js';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MEMBERS] });

async function importVerifications() {
    client.once('ready', async () => {
        console.log('discord bot ready');
        const hasVerified = [];
        const guildId = '988364778781155358';
        const clientGuild = client.guilds.cache.get(guildId);
        const members = await clientGuild.members.fetch();
        members.each((member, key) => {
            console.log(member.user.username, member.roles.cache.get('1000644439133405244'));
            if (member.roles.cache.get('1000644439133405244')) {
                hasVerified.push({ 
                    _id: generateSnowflake(), 
                    discordId: member.user.id,                    
                    discord: `${ member.user.username }#${ member.user.discriminator }`,
                    status: 'verified',
                });
            }
        });
        await Promise.all(hasVerified.map(async (v) => {
            await User.findOneAndUpdate({ discordId: v.discordId }, { roles: ['verified', 'onboarded'] }).lean().exec();
            await Verification.create(v);
        }));
    });
    client.login(process.env.DISCORD_BOT_TOKEN);
    console.log('client', client);

}

if (isMainEntry(import.meta.url)) {
    (async () => {
        await connect();
        importVerifications();
    })();
}
