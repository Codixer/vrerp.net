import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const UserFile = mongoose.model(
  "File",
  new Schema(
    {
      _id: Long,
      category: {
        type: String,
        enum: [
          "profile",
          "fantasy",
          "verification",
          "assetimage",
          "asset",
          "guide",
          "report",
          "media",
        ],
        default: "profile",
      },
      parentId: Long,
      filename: String,
      userId: Long,
      originalUrl: String,
      imageSizes: [String],
      extension: { type: String, default: "png" },
    },
    {
      timestamps: true,
    }
  )
);
