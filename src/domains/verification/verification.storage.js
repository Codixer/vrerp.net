import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const Verification = mongoose.model(
  "Verification",
  new Schema(
    {
      _id: Long,
      discordId: Long,
      discord: String,
      userId: Long,
      image: Long,
      migrateVerification: String,
      requestedBy: [Long],
      adminId: Long,
      rejectionReason: String,
      status: {
        type: String,
        enum: ["draft", "submitted", "pending", "failed", "banned", "verified"],
        default: "draft",
      },
    },
    {
      timestamps: true,
    }
  )
);

export const VerificationSource = mongoose.model(
  "VerificationSource",
  new Schema(
    {
      _id: Long,
      discordId: Long,
      source: [String],
    },
    {
      timestamps: true,
    }
  )
);
