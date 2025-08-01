import User from "../models/User.js";
import dotenv from "dotenv";
import { promocodes } from "../data/promocodes.js";
import { Client } from "@stomp/stompjs";
import net from "net";
import tls from "tls";
import { Buffer } from "buffer";

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
  let client;
  let socket;

  try {
    const token = req.user_token;
    const promocode = req.body.promocode;

    const user = await User.findOne({ user_token: token });
    if (!user?.promo_codes.includes(promocode)) {
      return res.status(404).json({ message: "Промокод не найден" });
    }

    // 1. Создаем кастомный транспортный слой
    class CustomTransport {
      constructor(socket) {
        this.socket = socket;
        this.onmessage = null;
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
      }

      send(data) {
        this.socket.write(data);
      }

      close() {
        this.socket.end();
      }
    }

    // 2. Устанавливаем SSL соединение
    socket = tls.connect({
      host: "mq-test.maxi-retail.ru",
      port: 61617,
      rejectUnauthorized: false,
      servername: "mq-test.maxi-retail.ru",
    });

    // 3. Настраиваем STOMP клиент
    client = new Client({
      brokerURL: "ssl://mq-test.maxi-retail.ru:61617",
      connectHeaders: {
        login: process.env.LOGIN,
        passcode: process.env.PASSCODE,
        host: "/",
        "heart-beat": "5000,5000",
      },
      debug: (str) => console.log(`STOMP: ${str}`),
      reconnectDelay: 0,
    });

    // 4. Создаем кастомный транспорт
    const transport = new CustomTransport(socket);
    client.webSocket = transport;

    // 5. Обработчики событий сокета
    socket.on("data", (data) => {
      if (transport.onmessage) {
        transport.onmessage({ data: data.toString() });
      }
    });

    socket.on("secureConnect", () => {
      if (transport.onopen) {
        transport.onopen();
      }
    });

    socket.on("error", (err) => {
      if (transport.onerror) {
        transport.onerror(err);
      }
    });

    socket.on("close", () => {
      if (transport.onclose) {
        transport.onclose();
      }
    });

    // 6. Ожидаем подключения
    const connectionPromise = new Promise((resolve, reject) => {
      client.onConnect = () => {
        console.log("Успешное подключение к ActiveMQ");
        resolve();
      };

      client.onStompError = (frame) => {
        reject(
          new Error(
            `STOMP ошибка: ${frame.headers?.message || "Неизвестная ошибка"}`
          )
        );
      };

      client.onWebSocketError = (err) => {
        reject(err);
      };
    });

    client.activate();
    await connectionPromise;

    // 7. Отправляем сообщение
    await new Promise((resolve) => {
      client.publish({
        destination: "/queue/external.game.to.mobile",
        body: JSON.stringify({
          user_token: token,
          promocode: promocode,
        }),
        headers: {
          _type: "gamePromoCode",
          "content-type": "application/json",
        },
      });
      setTimeout(resolve, 300);
    });

    console.log("Промокод успешно отправлен");

    // 8. Обновляем пользователя
    await User.updateOne(
      { user_token: token },
      { $push: { activated_promo_codes: promocode } }
    );

    // 9. Закрываем соединение
    await new Promise((resolve) => {
      client.deactivate();
      socket.end(resolve);
    });

    return res.status(200).json({
      success: true,
      promocode: promocode,
    });
  } catch (error) {
    console.error("Полная ошибка:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });

    if (client) {
      try {
        await client.deactivate();
      } catch (deactivateError) {
        console.error("Ошибка при деактивации клиента:", deactivateError);
      }
    }

    if (socket) {
      socket.destroy();
    }

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Ошибка активации промокода",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
};
