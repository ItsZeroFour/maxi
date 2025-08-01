import User from "../models/User.js";
import dotenv from "dotenv";
import { promocodes } from "../data/promocodes.js";
import fs from "fs";
import stompit from "stompit";

dotenv.config();

export const userAuthorization = async (req, res) => {
  try {
    const userToken = req.body.user_token;

    if (!userToken) {
      return res
        .status(400)
        .json({ message: "Требуется user_token в теле запроса" });
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
    const user_token = req.user_token;

    if (!user_token) {
      return res.status(400).json({ error: "user_token не найден в токене" });
    }

    const user = await User.findOne({ user_token });

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

        const existingUser = await User.findOne({ user_token: user_token });

        if (!existingUser) {
          errors.push({ user_token, error: "Пользователь не найден" });
          continue;
        }

        const user = await User.findOneAndUpdate(
          { user_token: user_token },
          { $inc: { maxi_attempts: count } },
          { new: true }
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

export const levelStart = async (req, res) => {
  try {
    const user_token = req.user_token;

    const user = await User.findById(user_token);

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    if (user.default_attempts > 0) {
      user.default_attempts -= 1;
    } else if (user.maxi_attempts > 0) {
      user.maxi_attempts -= 1;
    } else {
      return res.status(400).json({
        message: "Нет доступных попыток",
        isLevelStart: false,
        default_attempts: user.default_attempts,
        maxi_attempts: user.maxi_attempts,
      });
    }

    await user.save();

    res.status(200).json({
      message: "Уровень начат",
      isLevelStart: true,
      default_attempts: user.default_attempts,
      maxi_attempts: user.maxi_attempts,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось начать уровень",
    });
  }
};

export const levelComplete = async (req, res) => {
  try {
    const levelCount = req.params.level;
    const token = req.user_token;

    const user = await User.findOne({ user_token: token });

    if (user.promo_codes.includes(promocodes[levelCount])) {
      return res.status(201).json({
        message: "Промокод уже получен",
        is_promocode_get: false,
        promocode: "",
        token,
      });
    }

    await User.findOneAndUpdate(
      { user_token: token },
      {
        $push: {
          promo_codes: promocodes[levelCount],
          completedLevels: {
            level: levelCount,
          },
        },
      }
    );

    return res.status(201).json({
      message: "Промокод получен",
      is_promocode_get: true,
      promocode: promocodes[levelCount],
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось завершить уровень",
    });
  }
};

export const completeOnbording = async (req, res) => {
  try {
    const user_token = req.user_token;

    const user = await User.findOneAndUpdate(
      { user_token },
      {
        onbording_complete: true,
      },
      { new: true }
    ).lean();

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Не удалось завершить онбординг",
    });
  }
};

export const activatePromocode = async (req, res) => {
  try {
    const token = req.user_token;
    const promocode = req.body.promocode;

    const user = await User.findOne({ user_token: token });
    if (!user.promo_codes.includes(promocode)) {
      return res.status(404).json({
        message: "Не удалось найти промокод в полученных",
      });
    }

    const connectOptions = {
      host: "mq-test.maxi-retail.ru",
      port: 61617,
      ssl: true,
      connectHeaders: {
        host: "/",
        login: process.env.LOGIN,
        passcode: process.env.PASSCODE,
        "heart-beat": "5000,5000",
      },
      sslOptions: {
        rejectUnauthorized: false,
        secureProtocol: "TLSv1_2_method",
        ciphers: "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256",
      },
      connectTimeout: 10000,
      reconnectOptions: {
        maxReconnects: 0,
      },
    };

    const promoData = {
      user_token: token,
      promocode: promocode,
    };

    const responseSent = { current: false };

    const client = await new Promise((resolve, reject) => {
      stompit.connect(connectOptions, (error, client) => {
        if (error) {
          console.error("Ошибка подключения:", {
            message: error.message,
            stack: error.stack,
            fullError: error,
          });
          reject(error);
          return;
        }
        resolve(client);
      });
    });

    console.log("Успешное подключение к ActiveMQ");

    const sendHeaders = {
      destination: "/queue/external.game.to.mobile",
      _type: "gamePromoCode",
      "content-type": "application/json",
    };

    await new Promise((resolve, reject) => {
      const frame = client.send(sendHeaders);
      frame.write(JSON.stringify(promoData));
      frame.end();

      frame.on("error", reject);
      frame.on("finish", resolve);
    });

    console.log("Промокод отправлен:", promoData);

    await new Promise((resolve) => client.disconnect(resolve));
    console.log("Отключено от ActiveMQ");

    await User.findOneAndUpdate(
      { user_token: token },
      { $push: { activated_promo_codes: promocode } }
    );

    return res.status(200).json({
      activate_promocode: true,
      promocode: promocode,
      token,
    });
  } catch (err) {
    console.error("Ошибка активации промокода:", {
      message: err.message,
      stack: err.stack,
      fullError: err,
    });

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Не удалось активировать промокод",
        error: process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    } else {
      console.error("Попытка отправить ответ после отправки заголовков");
    }
  }
};
