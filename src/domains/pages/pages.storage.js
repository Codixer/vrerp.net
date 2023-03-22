import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';
mongooseLong(mongoose);
const { Schema, Types: { Long } } = mongoose; 

export const Page = mongoose.model('Page', new Schema({
    _id: Long,
    description: String,
    url: String,
    title: String,
    subtitle: String,
    telegraphPage: String,
    content: Object,
}, {
    timestamps: true,
}));
