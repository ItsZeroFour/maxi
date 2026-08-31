import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true },
);

const QuizQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    answers: {
      type: [AnswerSchema],
      validate: {
        validator: (arr) =>
          Array.isArray(arr) && arr.length >= 2 && arr.some((a) => a.isCorrect),
        message:
          "Нужно минимум 2 варианта ответа, и хотя бы один должен быть отмечен как правильный",
      },
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },

    order: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
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

QuizQuestionSchema.index({ order: 1 });

export default mongoose.model("QuizQuestion", QuizQuestionSchema);
