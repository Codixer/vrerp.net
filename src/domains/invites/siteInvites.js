import { User } from "../users/users.storage.js";
import { setVerificationStatus } from "../verification/verification.js";
import * as Events from '../events/events.js';
import * as EventTypes from '../events/events.types.js';

export async function generateInviteCode(userId) {
    const code = Math.random().toString(36).substring(2).substring(0,8);
    await User.findOneAndUpdate({ _id: userId }, { inviteCode: code }).exec();
    return code;
}

export async function applyInviteCode(userId, discordId, discord, code) {
    const inviter = await User.findOne({ inviteCode: code }).lean().exec();
    if (!inviter) {
        return false;
    }
    const user = await User.findOneAndUpdate({ _id: userId }, { inviterId: inviter._id }, { new: true }).exec();
    console.log('activating user', user);
    Events.emit(EventTypes.SITE_INVITE_ACCEPTED, user._id, { inviterId: inviter._id });
    await setVerificationStatus(discordId, discord, user._id, 'verified');
}
