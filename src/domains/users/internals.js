import _ from "lodash";
import { connect } from "../../helpers/connect.js";
import { isMainEntry } from "../../helpers/utils.js";
import { Profile, ProfileInternal } from "./users.storage.js";

export async function updateInternalProfile(profile) {
    const update = _.pick(profile, ['userId', 'url', 'discord']);
    update.complimentScore = 0;
    if (profile.compliments) {
        let allIds = [];
        Object.keys(profile.compliments).filter(k => !['Nice profile', 'Cute avatar'].includes(k)).map(k => {
            allIds = allIds.concat(profile.compliments[k].map(k => k.toString()));
        });
        allIds = Array.from(new Set(allIds));
        console.log(profile.compliments, 'allids', allIds);
        update.complimentScore = allIds.length;
    }
    if ((profile.gender) && (profile.orientation)) {
        let genderNumber = 0;
        let matchingCompatibility = 0;
        const gender = typeof profile.gender === 'string' ? [profile.gender] : profile.gender;
        if (gender.includes('Male') || gender.includes('Trans FtM')) {
            genderNumber = 1;
        } else if (gender.includes('Female') || gender.includes('Trans MtF')) {
            genderNumber = 2;
        } else {
            genderNumber = 7;
        }
        const orientation = typeof profile.orientation === 'string' ? [profile.orientation] : profile.orientation;
        if (orientation.includes('Straight')) {
            matchingCompatibility = (genderNumber || 1);
        }
        if (orientation.includes('Gay')) {
            if (matchingCompatibility) {
                matchingCompatibility = (genderNumber || 2) + 4;
            } else {
                matchingCompatibility = (genderNumber || 2) + 2;
            }
        }
        if (orientation.includes('Lesbian')) {
            if (matchingCompatibility) {
                matchingCompatibility = (genderNumber || 2) + 4;
            } else {
                matchingCompatibility = (genderNumber || 2) + 2;
            }
        }
    }

    // console.log(update);
    await ProfileInternal.findOneAndUpdate({ _id: profile._id }, update, { new: true, upsert: true });
}

async function prefillInternals() {
    const ids = await Profile.find({}).select('_id').lean().exec();
    const exists = await ProfileInternal.find({}).select('_id').lean().exec();
    const allIds = ids.map(row => row._id.toString());
    const existingIds = exists.map(row => row._id.toString());
    const missingIds = allIds.filter(id => !existingIds.includes(id));
    const profiles = await Profile.find({ _id: { $in: missingIds } }).lean().exec();
    while (profiles.length > 0) {
        console.log(profiles.length);
        await Promise.all(profiles.splice(0,100).map((p) => updateInternalProfile(p)));
    }
    
    console.log('prefill complete');
}

async function syncInternals() {
    const profiles = await Profile.find({ }).lean().exec();
    while (profiles.length > 0) {
        console.log(profiles.length);
        await Promise.all(profiles.splice(0,100).map((p) => updateInternalProfile(p)));
    }
    
    console.log('prefill complete');
}

if (isMainEntry(import.meta.url)) {
    (async () => {
        await connect();
        console.log(process.argv);
        if (process.argv.length < 3) {
            console.log('usage: internals.js [prefill | sync]');
            process.exit(0);
        }
        if (process.argv[2] === 'prefill') {
            await prefillInternals();
        } else if (process.argv[2] === 'sync') {
            await syncInternals();
        }
    })();
}
