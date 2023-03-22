
import { connect } from '../../helpers/connect.js';
import { generateSnowflake, isMainEntry } from '../../helpers/utils.js';
import { client, initBot } from './bot.js';


async function scrapeLogs() {
    console.log('scraping logs...');
    const channel = client.channels.cache.get('965886073785962507');
    const msgs = await channel.messages.fetch({ limit: 100 });
    msgs.each((msg, key) => {
        console.log(key, msg);
        msg.reactions.cache.forEach((reaction) => {
            console.log('reaction: ', reaction._emoji, reaction._emoji.name, reaction.count);
        });
        // console.log(msg.reactions);
    });
    
    // console.log(m);
    // console.log(msgs);
}

if (isMainEntry(import.meta.url)) {
    (async () => {
        await connect();
        initBot();
        client.once('ready', async () => {
            console.log(process.argv);
            if (process.argv.length < 3) {
                console.log('usage: logs.js [pull]');
                process.exit(0);
            }
            if (process.argv[2] === 'pull') {
                console.log('updating logs');
                await scrapeLogs();
            }
        });
    })();
}

