import mongoose from "mongoose";

const User = new mongoose.Schema({
  user_id: {
    type: String,
    // required: true,
    default: "",
  },

  total_attempts: {
    type: Number,
    // required: true,
    default: 0,
  },

  promo_codes: [String],
});

export default mongoose.model("User", User);
