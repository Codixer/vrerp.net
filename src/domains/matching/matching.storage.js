import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const Match = mongoose.model(
  "Match",
  new Schema(
    {
      _id: Long,
      profileId: Long,
      category: {
        type: String,
        enum: ["loves", "passes", "matches", "invites", "blocks"],
      },
      list: [Long],
    },
    {
      timestamps: true,
    }
  )
);
