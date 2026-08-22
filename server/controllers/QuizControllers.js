import User from "../models/User.js";
import QuizQuestion from "../models/QuizQuestion.js";
import { getMoscowDateString, getNextMoscowMidnightISO } from "../utils/moscowDate.js";

export const getQuizStatus = async (req, res) => {
  try {
    const user_token = req.user_token;

    const user = await User.findOne({ user_token });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const totalAttempts =
      (user.default_attempts || 0) + (user.maxi_attempts || 0);

    const todayStr = getMoscowDateString();
    const lastRewardStr = user.lastQuizAttemptAt
      ? getMoscowDateString(user.lastQuizAttemptAt)
      : null;
    const alreadyRewardedToday = lastRewardStr === todayStr;

    const quizAvailable = totalAttempts === 0 && !alreadyRewardedToday;

    return res.status(200).json({
      quizAvailable,
      attemptsLeft: totalAttempts,
      alreadyRewardedToday,
      nextQuizAvailableAt: alreadyRewardedToday
        ? getNextMoscowMidnightISO()
        : null,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения статуса квиза" });
  }
};

export const getQuizQuestions = async (req, res) => {
  try {
    const questions = await QuizQuestion.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const formatted = questions.map((q) => ({
      id: q._id,
      question: q.question,
      answers: (q.answers || []).map((a) => ({
        id: a._id,
        text: a.text,
      })),
    }));

    return res.status(200).json({ questions: formatted });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения вопросов квиза" });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const user_token = req.user_token;
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ message: "Неверный формат ответа" });
    }

    const user = await User.findOne({ user_token });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const totalAttempts =
      (user.default_attempts || 0) + (user.maxi_attempts || 0);

    if (totalAttempts > 0) {
      return res.status(400).json({
        message: "Квиз доступен только когда закончились попытки",
        quizPassed: false,
      });
    }

    const todayStr = getMoscowDateString();
    const lastRewardStr = user.lastQuizAttemptAt
      ? getMoscowDateString(user.lastQuizAttemptAt)
      : null;

    if (lastRewardStr === todayStr) {
      return res.status(400).json({
        message: "Награда за квиз уже получена сегодня, попробуйте завтра",
        quizPassed: false,
        alreadyRewardedToday: true,
      });
    }

    const questions = await QuizQuestion.find({ isActive: true }).lean();

    if (questions.length === 0) {
      return res.status(400).json({ message: "Вопросы квиза не найдены" });
    }

    if (answers.length !== questions.length) {
      return res.status(400).json({
        message: "Ответьте на все вопросы квиза",
        quizPassed: false,
      });
    }

    const questionsMap = new Map(
      questions.map((q) => [String(q._id), q]),
    );

    let allCorrect = true;

    for (const { questionId, answerId } of answers) {
      const question = questionsMap.get(String(questionId));

      if (!question) {
        allCorrect = false;
        break;
      }

      const answer = (question.answers || []).find(
        (a) => String(a._id) === String(answerId),
      );

      if (!answer || !answer.isCorrect) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      return res.status(200).json({
        message: "Есть неверные ответы, попробуйте ещё раз",
        quizPassed: false,
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_token },
      {
        $inc: { maxi_attempts: 1 },
        $set: { lastQuizAttemptAt: new Date() },
        $push: {
          attemptsAccrual: {
            type: "QUIZ",
            count: 1,
            accrualAt: new Date(),
          },
        },
      },
      { new: true },
    );

    return res.status(200).json({
      message: "Квиз пройден успешно! Начислена дополнительная попытка",
      quizPassed: true,
      awarded: { type: "QUIZ", count: 1 },
      default_attempts: updatedUser.default_attempts,
      maxi_attempts: updatedUser.maxi_attempts,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка сервера при обработке квиза" });
  }
};
