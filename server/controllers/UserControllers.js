import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const userAutharization = async (req, res) => {
  try {
    const user_token = req.token;

    if (!user_token) {
      return res.status(400).json({ error: "user_token не предоставлен" });
    }

    let user = await User.findOne({ user_token });

    if (!user) {
      const doc = new User({ user_token });
      user = await doc.save();
    }

    const newToken = jwt.sign({ user_token: user_token }, SECRET, {
      expiresIn: EXPIRES_IN,
    });

    return res.status(200).json({ ...user._doc, token: newToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Ошибка аутентификации" });
  }
};

export const userGet = async (req, res) => {
  try {
    const user_token = req.token;

    if (!user_token) {
      return res.status(400).json({ error: "user_token не найден в токене" });
    }

    const user = await User.findOne({ user_token });

    console.log(user_token);

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

        let decoded;
        try {
          decoded = jwt.verify(user_token, process.env.JWT_SECRET);
        } catch (err) {
          errors.push({ user_token, error: "Невалидный JWT токен" });
          continue;
        }

        const userToken = decoded.user_token;

        const user = await User.findOneAndUpdate(
          { user_token: userToken },
          { $inc: { total_attempts: count } },
          { new: true }
        );

        if (user) {
          results.push({ user_token, success: true });
        } else {
          errors.push({ user_token, error: "Пользователь не найден" });
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
