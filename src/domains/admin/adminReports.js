import _ from 'lodash';
import express from 'express';
import { getFilesByIds } from '../files/userFiles.js';
import { flagUser } from '../reports/reports.js';
import { Report } from '../reports/reports.storage.js';
import { banUser } from '../users/users.js';
import { Profile } from '../users/users.storage.js';

export const router = express.Router();

router.get('/api/moderator/reports', async (req, res) => {
    let reports = await Report.find({ status: 'adminReview' }).sort({ createdAt: 1 }).lean().exec();
    const allUsers = _.uniq(reports.reduce((acc, val) => acc.concat([ val.victimId, val.accusedId ]), []).filter((id) => id));
    const profiles = _.keyBy(await Profile.find({ userId: { $in: allUsers }}).select({ _id: 1, url: 1, userId: 1 }).lean().exec(), 'userId');
    console.log(profiles);
    reports = reports.map((r) => {
        return { 
            ...r, 
            id: r._id,
            accusedUrl: r.accusedId ? _.get(profiles, [r.accusedId.toString(), 'url']) : null,
            victimUrl: r.victimId ? _.get(profiles, [r.victimId.toString(), 'url']) : null,
        }
    })
    const files = await getFilesByIds(reports.map((v) => v.reportImage));
    res.send({ status: 'ok', data: { reports, files } });
});

router.post('/api/moderator/reports/:id', async (req, res) => {
    if (!req.params.id || !req.body.result) {
        return res.status(400).send({ error: 'id and result is required' });
    }
    let report = await Report.findOne({ _id: req.params.id }).lean().exec();
    if (!report) {
        return res.status(400).send({ error: 'invalid id' });
    }
    const adminId = req.user.id;
    const adminDecisionDays = req.body && req.body.days ? parseInt(req.body.days) : 3;
    if (req.body.result === 'none') {
        await Report.findOneAndUpdate({ _id: req.params.id }, { status: 'closed', adminId, adminDecision: 'none' });
    } else if (req.body.result === 'warn') {
        await Report.findOneAndUpdate({ _id: req.params.id }, { status: 'userNotification', adminId, adminDecision: 'warn' });
    } else if (req.body.result === 'flag') {
        await flagUser(report.accusedId, report._id, adminDecisionDays);
        await Report.findOneAndUpdate({ _id: req.params.id }, { status: 'userNotification', adminId, adminDecision: 'flag', adminDecisionDays });
    } else if (req.body.result === 'ban') {
        await banUser(report.accusedId);
        await Report.findOneAndUpdate({ _id: req.params.id }, { status: 'closed', adminId, adminDecision: 'ban' });
    }
    res.send({ status: 'ok' }); 
});
