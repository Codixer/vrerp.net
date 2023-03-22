// maintains mongo connection
import dotenv from 'dotenv';
import { default as findConfig } from 'find-config';
dotenv.config({ path: findConfig('.env') });

import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';

mongoose.Promise = global.Promise;
mongooseLong(mongoose);

// display full stack trace on promise rejection
process.on('unhandledRejection', r => console.error(r));

// auto-connect to mongoose
export const connect = async function connect() {
    if (mongoose.connection.readyState) {
        return mongoose.connection;
    }
    await mongoose.connect(process.env.MONGO, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, poolSize: 1000, });
    // mongoose.set('debug', true);

    const db = mongoose.connection;
    // error handling, and reconnection
    db.on('error', err => console.error(`Error ${err} while connecting to mongodb`));
    db.on('disconnected', () => console.log(`Disconnected from mongodb`));
    console.log('connected to Mongo');
    return true;
}



if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ) {
    (async () => {
        await connect();
        process.exit(0);
    })();
}
