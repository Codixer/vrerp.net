import mongoose from "mongoose";
import mongooseLong from "mongoose-long";

mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const Fantasy = mongoose.model(
  "Fantasy",
  new Schema(
    {
      _id: Long,
      authorId: Long,
      image: Long,
      text: String,
      link: String,
      status: {
        type: String,
        enum: ["draft", "published", "deleted"],
        default: "draft",
      },
    },
    {
      timestamps: true,
      strict: false,
    }
  )
);

export const FantasyProfile = mongoose.model(
  "FantasyProfile",
  new Schema(
    {
      fantasyId: Long,
      profileId: Long,
      type: {
        type: String,
        enum: ["upvote", "trial", "love"],
        default: "love",
      },
    },
    {
      timestamps: true,
      strict: false,
    }
  )
);
