import _ from 'lodash';
import fs from 'fs';
import express from 'express';
import { Verification, VerificationSource } from './verification.storage.js';
import { generateSnowflake, isMainEntry, publicObject } from '../../helpers/utils.js';
import { Profile, User } from '../users/users.storage.js';
import { getFilesByIds, publicFile } from '../files/userFiles.js';
import { UserFile } from '../files/userFiles.storage.js';
import { createThumbnails } from '../files/images.js';

import * as Events from '../events/events.js';
import * as EventTypes from '../events/events.types.js';
import { connect } from '../../helpers/connect.js';
import { banUser } from '../users/users.js';


export const router = express.Router();

const verificationQuery = (discordId, userId) => {
    if (discordId && userId) {
        return { $or: [{ discordId }, { userId }] }
    }
    return discordId ? { discordId } : { userId };
}

export async function setVerificationStatus(discordId, discord, userId, status = 'verified', adminId, rejectionReason) {
    let verification = await Verification.findOne(verificationQuery(discordId, userId)).sort({ updatedAt: -1 }).lean().exec();
    if ((!verification) || (verification.status === 'failed')) {
        verification = await Verification.create({
            _id: generateSnowflake(),
            discordId,
            userId,
            adminId,
            discord,
            requestedBy: [ ],
            status,
            rejectionReason,
        });
    } else {
        verification = await Verification.findOneAndUpdate({ _id: verification._id }, { status, adminId, rejectionReason }, { new: true });
    }
    if (status === 'verified') {
        const verifiedUser = await User.findOneAndUpdate(userId ? { _id: userId } : { discordId }, { $addToSet: { roles: 'verified' } }, { new: true }).exec();
        if (verifiedUser) {
            const existingProfile = await Profile.findOne({ _id: verifiedUser.profileId }).lean().exec();
            if (existingProfile && existingProfile.lookingFor && existingProfile.bio) {
                await User.findOneAndUpdate(userId ? { _id: userId } : { discordId }, { $addToSet: { roles: 'onboarded' } }, { new: true }).exec();
                await Profile.findOneAndUpdate({ _id: verifiedUser.profileId }, { profileVisibility: 'members' }).exec();
                Events.emit(EventTypes.ONBOARDED, verifiedUser._id);
            }
        }
        const verifiedUserId = verifiedUser ? verifiedUser._id : null;
        Events.emit(EventTypes.VERIFICATION_APPROVED, verifiedUserId, { discordId: verification.discordId });
    } else if (status === 'failed') {
        let msg = `Your verification has been rejected.\n`;
        if (rejectionReason && rejectionReason === 'profilepic') {
            msg += `Please make sure to use your main erping avi as your vrerp.net profile pic. 
    This is the first thing peeps look at to see if there's a good match, so you won't be successful on the site otherwise, ty 🤗`;
        } else if (rejectionReason && rejectionReason === 'noeboys') {
            msg += `No eboy avatars: https://telegra.ph/No-e-boy-avatars-01-12`;
        } else if (rejectionReason && rejectionReason === 'noprofile') {
            msg += `You don't have a profile set up, please make one on the site, ty :hugging:`;
        } else if (rejectionReason && rejectionReason === 'novr') {
            msg += `You don't have a VR headset, please get one before trying again, ty :hugging:`;
        } else if (rejectionReason && rejectionReason === 'discordmigration') {
            msg += `We don't know that discord for ID verification. Please submit your ID instead, ty :hugging:`;
        } else if (rejectionReason && rejectionReason === 'discordpaper') {
            msg += `Please make sure to write down your discord username, like, physically, on a piece of paper; and take a pic where the id, and this piece of paper is in the same picture, ty :hugging:`;
        }    
        Events.emit(EventTypes.VERIFICATION_DENIED, userId, { discordId: verification.discordId, rejectionMessage: msg });
    } else if (status === 'banned') {
        if (userId) {
            await banUser(userId, 'verification fail');
        }
    }
    return verification;
}

// export async function attemptAutoVerification(discordId, discord) {
//     const source = await VerificationSource.findOne({ discordId }).lean().exec();
//     if (!source) {
//         return false;
//     }
//     console.log(`importing member ${discord} verification from ${ source.source.join(', ') }`);
//     const newVerification = await Verification.findOneAndUpdate({ discordId }, {
//         $setOnInsert: { _id: generateSnowflake() },
//         discordId,
//         discord,
//         migrateVerification: source.source[0],
//         status: 'verified',
//     }, { upsert: true, new: true } );
//     return true;
// }

router.get('/api/verification', async (req, res) => {
    if (!req.user || !req.user.roles) {
        return res.status(400).send({ error: 'logged in user is required' });
    }
    const profile = await Profile.findOne({ _id: req.user.profileId }).lean().exec();
    // if (req.user.discordId) {
    //     await attemptAutoVerification(req.user.discordId, profile.discord);
    // }
    let verification = await Verification.findOne(verificationQuery(req.user.discordId, req.user._id)).sort({ updatedAt: -1 }).lean().exec();
    if (!verification) {
        verification = new Verification({ _id: generateSnowflake(), discordId: req.user.discordId, discord: profile.discord, userId: req.user._id });
        await verification.save();
        verification = verification.toObject();
    }
    if (verification && verification.status === 'verified' && req.user && req.user.roles && !req.user.roles.includes('verified')) {
        await User.findOneAndUpdate({ _id: req.user._id }, { $addToSet: { roles: 'verified'} });
        req.user.roles.push('verified');
    }
    res.send({ status: 'ok', data: publicObject(verification) });
});

// creates a new verification ticket for authenticated users, if possible
router.post('/api/verification', async (req, res) => {
    if (!req.user || !req.user.roles) {
        return res.status(400).send({ error: 'logged in user is required' });
    }
    const profile = await Profile.findOne({ _id: req.user.profileId }).lean().exec();
    let verification = await Verification.findOne(verificationQuery(req.user.discordId, req.user._id)).sort({ updatedAt: -1 }).lean().exec();
    if (verification && (['draft', 'banned', 'verified'].includes(verification.status))) {
        return res.send({ status: 'ok', data: publicObject(verification) });
    }
    verification = new Verification({ _id: generateSnowflake(), discordId: req.user.discordId, discord: profile.discord, userId: req.user._id });
    await verification.save();
    res.send({ status: 'ok', data: { verification: publicObject(verification.toObject()) } });
});

router.get('/api/verification/:id', async(req, res) => {
    if (!req.params.id) {
        return res.status(400).send({ error: 'id is required' });
    }
    const verification = await Verification.findOne({ _id: req.params.id }).lean().exec();
    if (!verification) {
        return res.status(404).send({ status: 'error', error: 'not found' });
    }
    const files = await getFilesByIds([verification.image]);
    res.send({ status: 'ok', data: { verification: publicObject(verification), files } });
});

router.post('/api/verification/:id', async(req, res) => {
    if (!req.params.id) {
        return res.status(400).send({ error: 'id and image is required' });
    }
    let verification = await Verification.findOne({ _id: req.params.id }).lean().exec();
    if (!verification) {
        return res.status(400).send({ error: 'verification not found' });
    }
    if (['failed', 'verified'].includes(verification.status)) {
        return res.send({ status: 'ok', data: { status: verification.status } });
    }
    const updates = { };
    if (req.body.migrate) {
        updates.migrateVerification = req.body.migrate;
    }
    if (req.body.image) {
        await createThumbnails(req.body.image, ['thumbnail'])
        updates.image = req.body.image;
    }
    if (req.body.status === 'submit') {
        updates.status = 'pending';
        Events.emit(EventTypes.VERIFICATION_SUBMITTED, verification.userId, { discordId: verification.discordId });
    }
    verification = await Verification.findOneAndUpdate({ _id: req.params.id }, updates, { new: true });
    const files = await getFilesByIds([verification.image]);
    return res.send({ status: 'ok', data: { verification, files } });
});

if (isMainEntry(import.meta.url)) {
    (async () => {
        await connect();
        if (process.argv.length < 4) {
            console.log('usage: verificaiton.js [json file] [source]');
            process.exit(0);
        }
        const items = JSON.parse(fs.readFileSync(process.argv[2]));
        const writeops = items.map(discordId => { return { updateOne: { filter: { discordId }, update: {
            $setOnInsert: { _id: generateSnowflake() },
            discordId,
            $addToSet: { source: process.argv[3] }
        }, upsert: true, setDefaultsOnInsert: true }}});
        await VerificationSource.bulkWrite(writeops);
        console.log(JSON.stringify(writeops.length));
    })();
}
