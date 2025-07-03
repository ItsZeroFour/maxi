import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const userAuthorization = async (req, res) => {
  try {
    let userId;

    if (req.body.user_id) {
      userId = req.body.user_id;
    } else {
      const authHeader = req.headers.authorization || "";
      const tokenFromHeader = authHeader.replace(/Bearer\s?/i, "");

      if (!tokenFromHeader) {
        return res
          .status(400)
          .json({ message: "No user_id or token provided" });
      }

      try {
        const decoded = jwt.verify(tokenFromHeader, SECRET);
        userId = decoded.user_id;
      } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
      }
    }

    let user = await User.findOne({ user_id: userId });

    if (!user) {
      user = await new User({ user_id: userId }).save();
    }

    const newToken = jwt.sign({ user_id: userId }, SECRET, {
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
    const user_id = req.user_id;

    console.log(user_id);

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
        const { user_id, count } = attempt;

        if (!user_id || typeof count !== "number") {
          errors.push({ user_id, error: "Неверные данные" });
          continue;
        }

        const user = await User.findOneAndUpdate(
          { user_id },
          { $inc: { total_attempts: count } },
          { new: true }
        );

        if (user) {
          results.push({ user_id, success: true });
        } else {
          errors.push({ user_id, error: "Пользователь не найден" });
        }
      } catch (err) {
        console.log(err);
        errors.push({
          user_id: attempt.user_id,
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
