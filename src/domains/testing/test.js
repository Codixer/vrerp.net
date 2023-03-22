import _ from 'lodash';
import express from 'express';

import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';
mongooseLong(mongoose);
import { isMainEntry } from '../../helpers/utils.js';
import { User } from '../users/users.storage.js';

const { mongo } = mongoose;

export const router = express.Router();

router.get('/api/testing/onboard', async (req, res, next) => {
    if (!req.user) {
        return res.status(400).send({ error: 'please log in' });
    }
    await User.findOneAndUpdate({ _id: req.user._id }, { $addToSet: { roles: { $each: ['verified', 'onboarded'] }}});
    req.user.roles.push('onboarded');
    res.redirect('/');
});


if (isMainEntry(import.meta.url)) {
    console.log(mongo.Long.fromString('123123'));
}
