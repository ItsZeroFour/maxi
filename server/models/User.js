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
});

export default mongoose.model("User", User);
