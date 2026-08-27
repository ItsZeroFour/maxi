import User from "../models/User.js";
import QuizQuestion from "../models/QuizQuestion.js";
import { getMoscowDateString, getNextMoscowMidnightISO } from "../utils/moscowDate.js";

const findNextQuizQuestion = async (user) => {
  const answeredIds = new Set(
    (user.quizAnsweredQuestions || []).map((a) => String(a.question)),
  );

  const questions = await QuizQuestion.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return questions.find((q) => !answeredIds.has(String(q._id))) || null;
};

const hasAnsweredToday = (user) => {
  const todayStr = getMoscowDateString();
  const lastAnsweredStr = user.lastQuizAnsweredAt
    ? getMoscowDateString(user.lastQuizAnsweredAt)
    : null;
  return lastAnsweredStr === todayStr;
};

export const getQuizStatus = async (req, res) => {
  try {
    const user_token = req.user_token;

    const user = await User.findOne({ user_token });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const totalAttempts =
      (user.default_attempts || 0) + (user.maxi_attempts || 0);

    let quizAvailable = false;

    if (totalAttempts === 0 && !hasAnsweredToday(user)) {
      const nextQuestion = await findNextQuizQuestion(user);
      quizAvailable = !!nextQuestion;
    }

    return res.status(200).json({
      quizAvailable,
      attemptsLeft: totalAttempts,
      nextQuizAvailableAt: quizAvailable ? null : getNextMoscowMidnightISO(),
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения статуса квиза" });
  }
};

export const getQuizQuestion = async (req, res) => {
  try {
    const user_token = req.user_token;

    const user = await User.findOne({ user_token });

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const totalAttempts =
      (user.default_attempts || 0) + (user.maxi_attempts || 0);

    if (totalAttempts > 0 || hasAnsweredToday(user)) {
      return res.status(200).json({ available: false });
    }

    const nextQuestion = await findNextQuizQuestion(user);

    if (!nextQuestion) {
      // Вопросы в админке закончились — тот же ответ, что и при дневном лимите
      return res.status(200).json({ available: false });
    }

    return res.status(200).json({
      available: true,
      question: {
        id: nextQuestion._id,
        question: nextQuestion.question,
        answers: (nextQuestion.answers || []).map((a) => ({
          id: a._id,
          text: a.text,
        })),
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения вопроса квиза" });
  }
};

export const submitQuiz = async (req, res) => {
  try {
    const user_token = req.user_token;
    const { questionId, answerId } = req.body;

    if (!questionId || !answerId) {
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
      });
    }

    if (hasAnsweredToday(user)) {
      return res.status(400).json({
        message: "Квиз на сегодня уже пройден, попробуйте завтра",
        available: false,
      });
    }

    const nextQuestion = await findNextQuizQuestion(user);

    if (!nextQuestion || String(nextQuestion._id) !== String(questionId)) {
      return res.status(400).json({
        message: "Этот вопрос сейчас недоступен",
        available: false,
      });
    }

    const answer = (nextQuestion.answers || []).find(
      (a) => String(a._id) === String(answerId),
    );

    if (!answer) {
      return res.status(400).json({ message: "Неверный вариант ответа" });
    }

    const isCorrect = !!answer.isCorrect;

    const update = {
      $set: { lastQuizAnsweredAt: new Date() },
      $push: {
        quizAnsweredQuestions: {
          question: nextQuestion._id,
          isCorrect,
          answeredAt: new Date(),
        },
      },
    };

    if (isCorrect) {
      update.$inc = { maxi_attempts: 1 };
      update.$push.attemptsAccrual = {
        type: "QUIZ",
        count: 1,
        accrualAt: new Date(),
      };
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_token },
      update,
      { new: true },
    );

    return res.status(200).json({
      isCorrect,
      rewardGranted: isCorrect,
      comment: nextQuestion.comment || "",
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