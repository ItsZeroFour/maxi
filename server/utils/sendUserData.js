import stompit from "stompit";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const connectOptions = {
  host: "mq-test.maxi-retail.ru",
  port: 61612,
  ssl: true,
  connectHeaders: {
    host: "/",
    login: process.env.LOGIN,
    passcode: process.env.PASSCODE,
    "heart-beat": "5000,5000",
  },
  rejectUnauthorized: false,
};

const sendBatch = (client, batch) => {
  return new Promise((resolve, reject) => {
    try {
      batch.forEach((msg) => {
        const sendHeaders = {
          destination: "/queue/external.game.to.mobile",
          _type: "gameUserInfo",
          "content-type": "application/json",
        };

        const frame = client.send(sendHeaders);
        frame.write(JSON.stringify(msg));
        frame.end();
      });

      console.log(`[sendBatch] Отправлено ${batch.length} сообщений`);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const sendUsersLevels = async () => {
  try {
    console.log("[sendUsersLevels] Начало выборки пользователей...");

    const users = await User.aggregate([
      { $match: { user_token: { $exists: true } } },
      {
        $project: {
          user_token: 1,
          current_level: { $max: "$completedLevels.level" },
        },
      },
    ]);

    console.log(`[sendUsersLevels] Найдено пользователей: ${users.length}`);

    if (!users.length) return;

    stompit.connect(connectOptions, async (error, client) => {
      if (error) {
        console.error(
          "[sendUsersLevels] Ошибка подключения к ActiveMQ:",
          error
        );
        return;
      }

      try {
        const batchSize = 1000;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize).map((u) => ({
            user_token: u.user_token,
            current_level: u.current_level || 0,
          }));

          await sendBatch(client, batch);
        }

        console.log("[sendUsersLevels] Все сообщения отправлены.");
      } catch (err) {
        console.error("[sendUsersLevels] Ошибка при отправке:", err);
      } finally {
        client.disconnect(() => {
          console.log("[sendUsersLevels] Отключено от ActiveMQ");
        });
      }
    });
  } catch (err) {
    console.error("[sendUsersLevels] Ошибка выполнения:", err);
  }
};
