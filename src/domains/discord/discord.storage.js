import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';

mongooseLong(mongoose);
const { Schema, Types: { Long } } = mongoose; 

export const DiscordRole = mongoose.model('DiscordRole', new Schema({
    _id: Long,
    tag: String,
    roleId: Long,
    guildId: Long,
}, {
    timestamps: true,
}));

export const Guild = mongoose.model('Guild', new Schema({
    _id: Long,
    discordId: Long,
    discordName: String,
    ageVerification: { type: Boolean, default: false },
    verifiedRoleId: Long,
    inviteLink: String,
}, {
    timestamps: true,
    strict: false,
}));
