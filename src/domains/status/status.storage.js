import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';
mongooseLong(mongoose);
const { Schema, Types: { Long } } = mongoose; 

export const HornyStatuses = [
    'horny', 'available', 'online', 'idle', 'offline', 'unavailable', 'dnd'
];

export const Status = mongoose.model('Status', new Schema({
    _id: Long,
    userId: Long,
    discordId: Long,
    discord: String,
    guilds: [Long],
    hornyExpires: Date,  // "horny" status expires in a few hours
    hornyStatus: { type: String, enum: ['horny', 'available', 'online', 'unavailable'], default: 'online' },
    discordStatus: { type: String, enum: ['online', 'idle', 'offline', 'dnd'], default: 'offline' },
    webStatus: { type: String, enum: ['online', 'offline'], default: 'offline' },
    webClients: [String],
    displayStatus: { type: String, enum: HornyStatuses, default: 'offline' },
    order: { type: Number, default: HornyStatuses.indexOf('offline') },
}, {
    timestamps: true,
}));
