import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';
import * as EventTypes from './events.types.js';

mongooseLong(mongoose);
const { Schema, Types: { Long } } = mongoose; 

export const UserEvent = mongoose.model('Event', new Schema({
    _id: Long,
    type: { type: String, enum: Object.values(EventTypes) },
    userId: Long,
    parameters: {
        sourceProfileId: Long,
    }
}, {
    timestamps: true,
    strict: false,
}));
