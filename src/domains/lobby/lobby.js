import _ from 'lodash';
import express from 'express';
import { Profile } from '../users/users.storage.js';
import { getProfileData, getProfileList } from '../users/profiles.js';
import { UserFile } from '../files/userFiles.storage.js';
import { publicFile } from '../files/userFiles.js';
import { fullAccess } from '../../helpers/utils.js';
import { Status } from '../status/status.storage.js';

export const router = express.Router();

router.get('/api/lobby', async (req, res, next) => {
    if (!req.user || !fullAccess(req.user)) {
        return res.status(400).send({ error: 'please log in' });
    }

    const maxNoActivityDays = 7;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - maxNoActivityDays);
    const ids = await Profile.aggregate([
        { $lookup: { from: 'status', localField: 'userId', foreignField: 'userId', as: 'status' } },
        { $match: { 'status.0.order' : { $in: [0, 1] }, 'lastActivity': { $gt: minDate },  profileVisibility: { $in: ['members', 'public'] } } },
        { $sort: { 'status.0.order': 1, 'lastActivity' : -1 } },
        { $project: { '_id': 1 }}
    ]);
    const list = ids.map((item) => item._id);
    const data = await getProfileList(req, list, ['status']);
    data.lobby = list;
    res.send({ status: 'ok', data });
});


router.get('/api/new-to-erp', async (req, res) => {
    if (!req.user || !fullAccess(req.user)) {
        return res.status(400).send({ error: 'please log in' });
    }
    const maxNoActivityDays = 30;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - maxNoActivityDays);

    const list = await Profile.find({ 
        erproles: { $in: ['New to ERP', 'Never ERP Before' ] }, profileVisibility: { $in: ['members', 'public'] }, 'lastActivity': { $gt: minDate },
    }, { _id: 1 }).sort({ lastActivity: -1 }).lean().exec();
    const data = list.map((item) => item._id);
    res.send({ status: 'ok', data });
});

router.get('/api/new-to-site', async (req, res) => {
    if (!req.user || !fullAccess(req.user)) {
        return res.status(400).send({ error: 'please log in' });
    }
    const maxBackDays = 14;
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - maxBackDays);

    const list = await Profile.find({
        'createdAt': { $gt: minDate }, profileVisibility: { $in: ['members', 'public'] },
    }, { _id: 1 }).sort({ createdAt: -1 }).lean().exec();
    const data = list.map((item) => item._id);
    res.send({ status: 'ok', data });
});
