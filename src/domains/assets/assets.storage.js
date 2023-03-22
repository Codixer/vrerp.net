import mongoose from 'mongoose';
import mongooseLong from 'mongoose-long';
mongooseLong(mongoose);
const { Schema, Types: { Long, Decimal128 } } = mongoose; 

export const Asset = mongoose.model('Asset', new Schema({
    _id: Long,
    tags: [String],
    creatorId: Long,
    originalImageUrl: String,
    image: Long,
    title: String,
    description: String,
    url: String,
    price: Decimal128,
    currency: String,
    clicks: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'deleted' ], default: 'draft' },
}, {
    strict: false, 
    timestamps: true,
}));

export const AssetTag = mongoose.model('AssetTag', new Schema({
    _id: Long,
    name: String,
    frequency: { type: Number, default: 0, },
}, {
    timestamps: true,
    strict: false,
}));
