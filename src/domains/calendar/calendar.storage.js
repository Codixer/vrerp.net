import mongoose from "mongoose";
import mongooseLong from "mongoose-long";

mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const CalendarUserEvent = mongoose.model(
  "CalendarUserEvent",
  new Schema(
    {
      _id: Long,
      platform: String,
      title: String,
      description: String,
      joinInstructions: String,
      eventDate: String,
      eventTimezone: String,
      duration: String,
      recurrence: String,
      userId: Long,
      creatorDiscord: String,
      image: Long,
      eventInstances: [Long],
      status: {
        type: String,
        enum: ["draft", "submitted", "approved"],
        default: "draft",
      },
    },
    {
      timestamps: true,
      strict: false,
    }
  )
);

export const CalendarEventInstance = mongoose.model(
  "CalendarEventInstance",
  new Schema(
    {
      _id: Long,
      userEventId: Long,
    },
    {
      timestamps: true,
      strict: false,
    }
  )
);

export const CalendarEventTag = mongoose.model(
  "CalendarEventTags",
  new Schema(
    {
      _id: Long,
      name: String,
      frequency: { type: Number, default: 0 },
    },
    {
      timestamps: true,
      strict: false,
    }
  )
);
