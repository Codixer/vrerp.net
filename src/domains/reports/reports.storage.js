import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const Report = mongoose.model(
  "Report",
  new Schema(
    {
      _id: Long,
      victimId: Long,
      accusedId: Long,
      accusedUsername: String,
      tags: [String],
      reportImage: Long,
      reportDetails: String,
      adminId: Long,
      adminDecision: { type: String, enum: ["none", "warn", "flag", "ban"] },
      adminDecisionDays: Number,
      mediationResponse: { type: String, enum: ["accept", "appeal"] },
      appealDetails: String,
      status: {
        type: String,
        enum: ["adminReview", "userNotification", "appealed", "closed"],
        default: "adminReview",
      },
    },
    {
      timestamps: true,
    }
  )
);
