import mongoose from "mongoose";

const User = new mongoose.Schema({
  user_token: {
    type: String,
    default: "",
  },

  promo_codes: [String],
  activated_promo_codes: [String],

  default_attempts: {
    type: Number,
    default: 2,
  },

  maxi_attempts: {
    type: Number,
    default: 0,
  },

  onbording_complete: {
    type: Boolean,
    default: false,
  },

  completedLevels: [
    {
      level: { type: Number, min: 1, max: 30 },
      timestamp: { type: Date, default: Date.now },
    },
  ],

  attemptsAccrual: [
    {
      type: {
        type: String,
        enum: ["MAXI", "DEFAULT"],
        required: true,
      },
      count: {
        type: Number,
        required: true,
      },
      accrualAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

export default mongoose.model("User", User);
