import User from "../models/User.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export const userAutharization = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "ID пользователя не найден" });
    }

    const existingUser = await User.findOne({ user_id });

    if (existingUser) {
      const token = jwt.sign(
        {
          _id: existingUser._id,
        },
        SECRET,
        {
          expiresIn: EXPIRES_IN,
        }
      );

      return res.status(200).json({ ...existingUser._doc, token });
    }

    const doc = new User({ user_id });

    const user = await doc.save();

    const token = jwt.sign({ _id: user._id }, SECRET, {
      expiresIn: EXPIRES_IN,
    });

    const userData = user._doc;

    res.json({ ...userData, token });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось зарегестрироваться",
    });
  }
};

export const userGet = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "Не удалось получить пользователя",
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось получить пользователя",
    });
  }
};

export const updateUserAttempts = async (req, res) => {
  try {
    const userId = req.body.user_id;
    const incAttemptsCount = req.body.attempts;

    if (!userId || !incAttemptsCount) {
      return res.status(401).json({
        message: "Обязательные поля не найдены",
      });
    }

    const user = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $inc: { total_attempts: incAttemptsCount },
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "Пользователь не найден",
      });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось обновить попытки пользователя",
    });
  }
};







   
