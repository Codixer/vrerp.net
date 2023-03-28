import mongoose from "mongoose";
import mongooseLong from "mongoose-long";
mongooseLong(mongoose);
const {
  Schema,
  Types: { Long },
} = mongoose;

export const Profile = mongoose.model(
  "Profile",
  new Schema(
    {
      _id: Long,
      avatar: String,
      discord: String,
      vrchat: String,
      chilloutvr: String,
      onlineTimes: String,
      lookingFor: String,
      bio: String,
      link: String,
      yearOfBirth: Number,
      profileVisibility: {
        type: String,
        enum: ["draft", "hidden", "members", "public"],
        default: "draft",
      },
      discordVisibility: {
        type: String,
        enum: ["matches", "members", "public"],
        default: "members",
      },
      fantasiesVisibility: {
        type: String,
        enum: ["matches", "members", "public"],
        default: "members",
      },
      datesVisibility: {
        type: String,
        enum: ["matches", "members"],
        default: "matches",
      },
      discordNotifications: { type: Number, default: 255 },
      userId: Long,
      username: String,
      url: String, // lowercase of username
      lastActivity: Date,
      available: { type: Number, default: 0 },
      compliments: Object,
      files: [String],
      wishlist: [Long],
      flags: [String],
      flagsExpire: Date,
      featured: Boolean,
    },
    {
      strict: false,
      timestamps: true,
    }
  )
);

export const ProfileInternal = mongoose.model(
  "ProfileInternal",
  new Schema(
    {
      _id: Long,
      userId: Long,
      url: String,
      discord: String,
      dailyMatches: { type: Number, default: 0 },
      dailyMatchesDate: String,
      complimentScore: Number,
      // 1 for male straight, 2 for female straight, 3 for male gay, 4 for female lesbian, 5 for male bi, 6 for female bi, 7 for other
      matchingCompatibility: Number,
    },
    {
      strict: false,
      timestamps: true,
    }
  )
);

export const Kink = mongoose.model(
  "Kink",
  new Schema(
    {
      _id: Long,
      name: String,
      frequency: { type: Number, default: 0 },
    },
    {
      strict: false,
      timestamps: true,
    }
  )
);

export const User = mongoose.model(
  "User",
  new Schema(
    {
      _id: Long,
      discord: String,
      discordId: { type: Long, unique: true },
      email: String,
      password: String,
      profileId: Long,
      roles: [String],
      suspendUntil: Date,
      adminMessage: String,
      loginCodes: [String],
      inviterId: Long,
    },
    {
      timestamps: true,
    }
  )
);
