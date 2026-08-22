import QuizQuestion from "../models/QuizQuestion.js";

export const getQuizQuestionsAdmin = async (req, res) => {
  try {
    const questions = await QuizQuestion.find({}).sort({
      order: 1,
      createdAt: 1,
    });

    return res.status(200).json({ questions });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения вопросов квиза" });
  }
};

export const createQuizQuestion = async (req, res) => {
  try {
    const { question, answers, order, isActive } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ message: "Текст вопроса обязателен" });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return res
        .status(400)
        .json({ message: "Нужно минимум 2 варианта ответа" });
    }

    if (!answers.some((a) => a.isCorrect)) {
      return res
        .status(400)
        .json({ message: "Нужно отметить хотя бы один правильный ответ" });
    }

    if (answers.some((a) => !a.text || !String(a.text).trim())) {
      return res
        .status(400)
        .json({ message: "У каждого варианта ответа должен быть текст" });
    }

    const created = await QuizQuestion.create({
      question: question.trim(),
      answers: answers.map((a) => ({
        text: String(a.text).trim(),
        isCorrect: !!a.isCorrect,
      })),
      order: typeof order === "number" ? order : 0,
      isActive: isActive !== undefined ? !!isActive : true,
    });

    return res.status(201).json({ question: created });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка создания вопроса квиза" });
  }
};

export const updateQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answers, order, isActive } = req.body;

    const update = {};

    if (question !== undefined) {
      if (typeof question !== "string" || !question.trim()) {
        return res.status(400).json({ message: "Неверный текст вопроса" });
      }
      update.question = question.trim();
    }

    if (answers !== undefined) {
      if (!Array.isArray(answers) || answers.length < 2) {
        return res
          .status(400)
          .json({ message: "Нужно минимум 2 варианта ответа" });
      }
      if (!answers.some((a) => a.isCorrect)) {
        return res
          .status(400)
          .json({ message: "Нужно отметить хотя бы один правильный ответ" });
      }
      if (answers.some((a) => !a.text || !String(a.text).trim())) {
        return res
          .status(400)
          .json({ message: "У каждого варианта ответа должен быть текст" });
      }

      update.answers = answers.map((a) => ({
        text: String(a.text).trim(),
        isCorrect: !!a.isCorrect,
      }));
    }

    if (order !== undefined) {
      if (typeof order !== "number") {
        return res.status(400).json({ message: "Неверное значение order" });
      }
      update.order = order;
    }

    if (isActive !== undefined) {
      update.isActive = !!isActive;
    }

    const updated = await QuizQuestion.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Вопрос не найден" });
    }

    return res.status(200).json({ question: updated });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка обновления вопроса квиза" });
  }
};

export const deleteQuizQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await QuizQuestion.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Вопрос не найден" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка удаления вопроса квиза" });
  }
};
