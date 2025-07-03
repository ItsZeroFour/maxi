import User from "../models/User.js";
// import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// const SECRET = process.env.JWT_SECRET;
// const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const userAuthorization = async (req, res) => {
  try {
    const userToken = req.body.user_token;
    
    if (!userToken) {
      return res.status(400).json({ message: "Требуется user_token в теле запроса" });
    }

    let user = await User.findOne({ user_token: userToken });

    if (!user) {
      user = await new User({ user_token: userToken }).save();
    }

    return res.status(200).json({ ...user._doc });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка сервера при авторизации" });
  }
};

export const userGet = async (req, res) => {
  try {
    const user_id = req.user_id;

    if (!user_id) {
      return res.status(400).json({ error: "user_id не найден в токене" });
    }

    const user = await User.findOne({ user_id });

    console.log(user_id);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.status(200).json(user._doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Ошибка получения пользователя" });
  }
};

export const addAttempts = async (req, res) => {
  try {
    const { attempts } = req.body;

    if (!attempts || !Array.isArray(attempts)) {
      return res.status(400).json({ error: "Неверный формат запроса" });
    }

    const results = [];
    const errors = [];

    for (const attempt of attempts) {
      try {
        const { user_token, count } = attempt;

        if (!user_token || typeof count !== "number") {
          errors.push({ user_token, error: "Неверные данные" });
          continue;
        }

        // Работаем с чистым user_token без декодирования
        const user = await User.findOneAndUpdate(
          { user_token: user_token }, // Ищем по user_token
          { $inc: { total_attempts: count } },
          { new: true, upsert: true } // Добавляем upsert для создания пользователя, если не найден
        );

        if (user) {
          results.push({ user_token, success: true });
        } else {
          errors.push({ user_token, error: "Ошибка обновления пользователя" });
        }
      } catch (err) {
        console.log(err);
        errors.push({
          user_token: attempt.user_token,
          error: "Ошибка обработки",
        });
      }
    }

    res.status(200).json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Ошибка сервера при обработке попыток",
    });
  }
};
