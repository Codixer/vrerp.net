import _ from 'lodash';
import mongoose from 'mongoose';
import express from 'express';

import { Fantasy, FantasyProfile } from './fantasies.storage.js';
import { fullAccess, generateSnowflake, isMainEntry } from '../../helpers/utils.js';
import { UserFile } from '../files/userFiles.storage.js';
import { createThumbnails } from '../files/images.js';
import { getProfile, getProfileData } from '../users/profiles.js';
import { deleteFiles, getFilesByIds } from '../files/userFiles.js';
import { Profile } from '../users/users.storage.js';
import { connect } from '../../helpers/connect.js';


const { mongo } = mongoose;

export const fantasyRouter = express.Router();

export const getFantasyFiles = (ids) => getFilesByIds(ids, ['userId']);

export const getPublicFantasy = (data) => { return { ... _.omit(data, '_id', '__v'), id: data['_id'] } };

export const getProfileFantasies = async(profileId) => {
    const f = await FantasyProfile.find({ profileId }).lean().exec();
    const trial = f.filter((f) => f.type === 'trial').map((f) => f.fantasyId)
        .sort((a,b) => (BigInt(a) < (BigInt(b)) ? 0 : -1));
    const love = f.filter((f) => f.type === 'love').map((f) => f.fantasyId).sort()
        .sort((a,b) => (BigInt(a) < (BigInt(b)) ? 0 : -1));
    return { trial, love, count: trial.length + love.length };
}

export const getFantasyLikes = async(fantasyList) => {
    const likeData = await FantasyProfile.aggregate([
        { $group: { _id: '$fantasyId', 'profiles': { $addToSet: '$profileId' } } },
        { $match: { _id: { $in: fantasyList.map((id) => mongo.Long.fromString(id.toString())) } } } 
    ]);
    const profileList = Array.from(new Set(likeData.reduce((arr, val) => arr.concat(val.profiles), [])));
    const profileUrls = await Profile.find({ 
        _id: { $in: profileList }, 
        profileVisibility: { $in: ['members', 'public'] }, 
        fantasiesVisibility: { $in: ['members', 'public'] } 
    }).select(['_id', 'url', 'username']).lean().exec();
    const profileMap = profileUrls.reduce((arr, val) => { arr[val._id] = val.url; return arr; }, {});
    const fantasyLikes = likeData.reduce((arr, val) => { arr[val._id] = val.profiles.map((p) => profileMap[p.toString()]).filter(p => p); return arr; }, {});
    fantasyList.forEach((item) => fantasyLikes[item] = fantasyLikes[item] || []);
    return fantasyLikes;
}

export const getFantasyAuthors = async(fantasies) => {
    const authorIds = fantasies.map(f => f.authorId.toString());
    const profileUrls = await Profile.find({ 
        _id: { $in: authorIds }, 
        profileVisibility: { $in: ['members', 'public'] },
    }).select(['_id', 'url', 'username']).lean().exec();
    const profileMap = profileUrls.reduce((arr, val) => { arr[val._id] = val.url; return arr; }, {});
    return fantasies.map((item) => { item.author = profileMap[item.authorId]; return item; });
}

export const getFantasyList = async(lastId) => {
    const filter = { status: { $ne: 'draft'} };
    if (lastId) {
        filter._id = { $lt: lastId };
    }
    let data = await Fantasy.find(filter).sort({ createdAt: -1 }).limit(10).lean().exec();
    data = data.map((d) => getPublicFantasy(d));
    data = await getFantasyAuthors(data);
    const fantasyList = data.map((d) => d.id);
    const fantasies = _.keyBy(data, 'id');
    const files = await getFantasyFiles(data.map((d) => d.image).filter(d => d));
    const fantasyLikes = await getFantasyLikes(fantasyList);
    return { fantasyList, fantasies, files, fantasyLikes };
};

export const getFantasies = async (ids) => {
    if (ids.length === 0) {
        return { fantasies: {}, files: {} };
    }
    let fantasies = await Fantasy.find({ _id: { $in: ids } }).lean().exec();
    fantasies = fantasies.map((f) => getPublicFantasy(f));
    fantasies = await getFantasyAuthors(fantasies);
    const fileIds = fantasies.reduce((acc, f) => [ ...acc, f.image], []);
    const files = await getFantasyFiles(fileIds);
    return { fantasies: _.keyBy(fantasies, 'id'), files };
};

fantasyRouter.get('/api/fantasies', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(400).send({ error: 'logged in user required' });
    }
    res.send({ status: 'ok', data: await getFantasyList(req.query.lastId) });
});

fantasyRouter.post('/api/fantasies', async (req, res) => {
    if (!req.session || !req.session.userId || !fullAccess(req.user)) {
        return res.status(400).send({ error: 'logged in user required' });
    }
    let fantasy = await Fantasy.create({ _id: generateSnowflake(), authorId: req.user.profileId });
    fantasy = getPublicFantasy(fantasy.toObject());
    console.log(fantasy)
    res.send({ status: 'ok', data: { fantasy }});
});

fantasyRouter.get('/api/fantasies/:id', async (req, res) => {
    if (!req.params.id) {
        return res.status(400).send({ error: 'logged in user, and fantasy id required' });
    }
    let fantasy = await Fantasy.findOne({ _id: req.params.id }).lean().exec();
    if (!fantasy) {
        res.status(404).send({ error: 'not found' });
    }
    if ((fantasy.status === 'draft') && (!req.session.userId || (fantasy.authorId.toString() !== req.user.profileId.toString()))) {
        return res.status(401).send({ error: 'access denied' });
    }
    res.send({ status: 'ok', data: { 
        fantasy: getPublicFantasy(fantasy), 
        files: await getFantasyFiles([fantasy.image]),
        fantasyLikes: await getFantasyLikes([ req.params.id ]),
    } });
});

fantasyRouter.post('/api/fantasies/:id', async (req, res) => {
    if (!req.session || !req.session.userId || !req.params.id) {
        return res.status(400).send({ error: 'logged in user, and fantasy id required' });
    }
    let fantasy = await Fantasy.findOne({ _id: req.params.id }).lean().exec();
    if (!fantasy) {
        res.status(404).send({ error: 'not found' });
    }
    if (fantasy.authorId.toString() !== req.user.profileId.toString()) {
        return res.status(401).send({ error: 'access denied' });
    }
    const updates = _.pick(req.body, ['image', 'text', 'link', 'status']);
    if (updates['image']) {
        await createThumbnails(updates['image'], ['thumbnail']);
    }
    fantasy = await Fantasy.findOneAndUpdate({ _id: req.params.id }, { $set: updates }, { new: true }).lean().exec();
    res.send({ status: 'ok', data: { 
        fantasy: getPublicFantasy(fantasy), 
        files: await getFantasyFiles([fantasy.image]),
        fantasyLikes: await getFantasyLikes([ req.params.id ]) 
    } });
});

fantasyRouter.post('/api/fantasy-profile/:id/:type', async (req, res) => {
    if (!req.user || !req.user.roles || !req.user.profileId) {
        return res.status(400).send({ error: 'please log in' });
    }
    if ((!req.params.id) || (!req.params.type)) {
        return res.status(400).send({ error: 'id, and type required' });
    }
    if (!['love', 'trial', 'upvote'].includes(req.params.type)) {
        return res.status(400).send({ error: 'unknown type' });
    }
    let fantasy = await Fantasy.findOne({ _id: req.params.id }).lean().exec();
    if (!fantasy) {
        res.status(404).send({ error: 'not found' });
    }
    const doc = { fantasyId: req.params.id, profileId: req.user.profileId, type: req.params.type };
    await FantasyProfile.findOneAndUpdate(doc, doc, { new: true, upsert: true }).lean().exec();
    res.send({ status: 'ok', data: { profile: await getProfileData(req, await getProfile(req.user.profileId)) } });
});

fantasyRouter.delete('/api/fantasy-profile/:id/:type', async (req, res) => {
    if (!req.user || !req.user.roles || !req.user.profileId) {
        return res.status(400).send({ error: 'please log in' });
    }
    if ((!req.params.id) || (!req.params.type)) {
        return res.status(400).send({ error: 'id, and type required' });
    }
    if (!['love', 'trial', 'upvote'].includes(req.params.type)) {
        return res.status(400).send({ error: 'unknown type' });
    }
    let fantasy = await Fantasy.findOne({ _id: req.params.id }).lean().exec();
    if (!fantasy) {
        res.status(404).send({ error: 'not found' });
    }
    await FantasyProfile.deleteOne({ fantasyId: req.params.id, profileId: req.user.profileId, type: req.params.type }).exec();
    res.send({ status: 'ok', data: { profile: await getProfileData(req, await getProfile(req.user.profileId)) } });
});

export const deleteFantasyById = async (id) => {
    console.log('deleting fantasy', id);
    await FantasyProfile.deleteMany({ fantasyId: id }).exec();
    const fantasy = await Fantasy.findOne({ _id: mongo.Long.fromString(id) }).lean().exec();
    console.log('fantasy', fantasy);
    if (fantasy.image) {
        await deleteFiles([fantasy.image]);
    }
    await Fantasy.deleteOne({ _id: id }).exec();
    return true;
}

if (isMainEntry(import.meta.url)) {
    (async () => {
        await connect();
        console.log(process.argv);
        if (process.argv.length < 4) {
            console.log('usage: fantasies.js [delete [fantasyId]]');
            process.exit(0);
        }
        if (process.argv[2] === 'delete') {
            const fantasyId = process.argv[3];
            await deleteFantasyById(fantasyId);
        }
    })();
}

