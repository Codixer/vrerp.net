import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';

mongooseLong(mongoose);
const { Schema, Types: { Long } } = mongoose; 

export const UserDateProfile = mongoose.model('DateProfile', new Schema({
    _id: Long,
    userId: Long,
    username: String,
    userTimezone: String,
    userTimezoneOffset: Number,
    available: [Number],
}, {
    timestamps: true,
    strict: false,
}));

export const UserDateInstance = mongoose.model('DateInstance', new Schema({ 
    _id: Long,
    inviter: Long,
    invited: Long,
    status: { type: String, enum: ['invited', 'accepted', 'rejected' ], default: 'invited' },
    message: String,
    startDate: Date,
}, {
    timestamps: true,
    strict: false,
}));
