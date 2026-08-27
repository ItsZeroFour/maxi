import mongoose from "mongoose";

export const BOOSTER_TYPES = [
  "impulse_line4_horizont",
  "impulse_line4_vertical",
  "vspyshka_line5",
  "prizma_gt",
];

const LevelRewardSchema = new mongoose.Schema(
  {
    level: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
    },

    rewardType: {
      type: String,
      enum: ["promocode", "booster"],
      required: true,
    },

    promocode: {
      type: String,
      trim: true,
    },

    boosterType: {
      type: String,
      enum: BOOSTER_TYPES,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export default mongoose.model("LevelReward", LevelRewardSchema);