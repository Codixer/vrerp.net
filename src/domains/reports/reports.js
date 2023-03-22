import _ from 'lodash';
import express from 'express';
import axios from 'axios';
import { Report } from './reports.storage.js';
import { generateSnowflake } from '../../helpers/utils.js';
import { getUserFromString } from '../users/users.js';
import { UserFile } from '../files/userFiles.storage.js';
import { createThumbnails } from '../files/images.js';
import { publicFile } from '../files/userFiles.js';
import { Profile } from '../users/users.storage.js';
import { discordLog } from '../discord/bot.js';

export const router = express.Router();

export async function flagUser(userId, reportId, days) {
    let expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + parseInt(days));
    const profile = await Profile.findOne({ userId }).lean().exec();
    expireDate = profile.flagsExpire ? new Date(Math.max(expireDate, profile.flagsExpire)) : expireDate;
    const report = await Report.findOne({ _id: reportId }).lean().exec();
    await Profile.findOneAndUpdate({ userId },
        { 
            $addToSet: { flags: report.tags },
            flagsExpire: expireDate,
        }
    );
    return true;
}

export const publicReport = (data) => { return data ? { ... _.omit(data, ['_id', 'createdAt', 'updatedAt', '__v', 'victimId', 'adminId']), id: data['_id'] } : null };

router.post('/api/reports', async (req, res, next) => {
    if (!req.body || !req.body.user || !req.body.tags || !req.body.details) {
        return res.status(400).send({ error: 'user, tags, and details required' });
    }
    const victimId = (req.user && req.user.id) ? req.user.id : null;
    const accusedId = await getUserFromString(req.body.user);
    const reportData = {
        _id: generateSnowflake(),
        victimId,
        accusedId,
        accusedUsername: req.body.user,
        tags: req.body.tags,
        reportDetails: req.body.details,
    };
    if (req.body.image) {
        const file = await UserFile.findOne({ _id: req.body.image, category: 'report', parentId: { $exists: false } }).lean().exec();
        if (file) {
            await UserFile.findOneAndUpdate({ _id: req.body.image }, { parentId: reportData._id });
            reportData.reportImage = req.body.image;
        }
    }
    await Report.create(reportData);
    discordLog(`New report made\n${ process.env.SERVER_URL }admin/mediations`);
    res.send({ status: 'ok' });
});

router.post('/api/reports/images/:id', async (req, res, next) => {
    if (!req.params.id) {
        return res.status(400).send({ error: 'id required' });
    }
    const file = await UserFile.findOne({ _id: req.params.id, category: 'report', parentId: { $exists: false } }).lean().exec();
    if (!file) {
        return res.status(400).send({ error: 'invalid id' });
    }
    if (!file.imageSizes || file.imageSizes.length === 0) {
        await createThumbnails(file._id, ['thumbnail']);
    }
    const data = await UserFile.findOne({ _id: req.params.id }).lean().exec();
    res.send({ status: 'ok', data: publicFile(data) });
});

router.post('/api/reports/acknowledge', async (req, res, next) => {
    if ((!req.body.id) || (!req.user.id)) {
        return res.status(400).send({ error: 'id, and user required' });
    }
    const report = await Report.findOne({ _id: req.body.id }).lean().exec();
    if (!report || report.accusedId.toString() !== req.user.id.toString()) {
        return res.status(400).send({ error: 'invalid request' });
    }
    await Report.findOneAndUpdate({ _id: req.body.id }, { status: 'closed' });
    res.send({ status: 'ok' });
});

