import User from "../models/User.js";
import dotenv from "dotenv";
import { promocodes } from "../data/promocodes.js";
import stompit from "stompit";
import tls from "tls";

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

    const connectOptions = {
      host: "mq-test.maxi-retail.ru",
      port: 61617,
      connectHeaders: {
        host: "/",
        login: process.env.LOGIN,
        passcode: process.env.PASSCODE,
        "heart-beat": "5000,5000",
      },
    };

    const user = await User.findOne({ user_token: token });

    if (!user || !user.promo_codes.includes(promocode)) {
      console.error(
        `[activatePromocode] Промокод не найден у пользователя: user_token=${token}, promocode=${promocode}`
      );
      return res.status(404).json({
        message: "Не удалось найти промокод в полученных",
      });
    }

    const promoData = {
      user_token: token,
      promocode: promocode,
    };

    const sendPromoData = () => {
      return new Promise((resolve, reject) => {
        // Создаем TLS-соединение
        const tlsSocket = tls.connect(
          {
            host: connectOptions.host,
            port: connectOptions.port,
            rejectUnauthorized: false, // ❗ Только для тестов. В проде нужно true и cert
          },
          () => {
            // Теперь создаем соединение STOMP поверх TLS-сокета
            stompit.connect(
              { ...connectOptions, socket: tlsSocket },
              (error, client) => {
                if (error) {
                  console.error(
                    `[activatePromocode] Ошибка подключения к ActiveMQ:`,
                    error.stack || error
                  );
                  return reject(error);
                }

                client.on("error", (err) => {
                  console.error(
                    `[activatePromocode] Ошибка соединения ActiveMQ:`,
                    err.stack || err
                  );
                  reject(err);
                });

                console.log(
                  "[activatePromocode] Успешное подключение к ActiveMQ"
                );

                const sendHeaders = {
                  destination: "/queue/external.game.to.mobile",
                  _type: "gamePromoCode",
                  "content-type": "application/json",
                };

                const frame = client.send(sendHeaders);

                frame.on("error", (frameError) => {
                  console.error(
                    `[activatePromocode] Ошибка отправки frame:`,
                    frameError.stack || frameError
                  );
                  client.disconnect(() => {});
                  reject(frameError);
                });

                frame.write(JSON.stringify(promoData));
                frame.end(() => {
                  console.log(
                    "[activatePromocode] Промокод отправлен:",
                    promoData
                  );
                  client.disconnect(() => {
                    console.log("[activatePromocode] Отключено от ActiveMQ");
                    resolve();
                  });
                });
              }
            );
          }
        );

        tlsSocket.on("error", (err) => {
          console.error(
            "[activatePromocode] Ошибка TLS-соединения:",
            err.stack || err
          );
          reject(err);
        });
      });
    };

    try {
      await sendPromoData();

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
      console.error(
        `[activatePromocode] Ошибка при отправке в stomp или обновлении базы:`,
        err.stack || err
      );
      return res.status(500).json({
        message: "Не удалось активировать промокод",
      });
    }
  } catch (err) {
    console.error(`[activatePromocode] Внутренняя ошибка:`, err.stack || err);
    res.status(500).json({
      message: "Не удалось активировать промокод",
    });
  }
};
