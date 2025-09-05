import cron from "node-cron";
import User from "../models/User.js";

export const setupDailyReset = () => {
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        console.log(
          `[${new Date().toISOString()}] Starting daily reset (default_attempts)...`
        );

        // Получаем всех пользователей, которым нужно сбросить попытки
        const users = await User.find({});

        for (const user of users) {
          const currentDefaultAttempts = user.default_attempts;
          const resetAmount = 2 - currentDefaultAttempts;

          if (resetAmount > 0) {
            await User.findOneAndUpdate(
              { user_token: user.user_token },
              {
                $set: { default_attempts: 2 },
                $push: {
                  attemptsAccrual: {
                    type: "DEFAULT",
                    count: resetAmount,
                    accrualAt: new Date(),
                  },
                },
              }
            );
          }
        }

        console.log(`Daily reset completed. Users processed: ${users.length}`);
      } catch (error) {
        console.error("Daily reset error:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Europe/Moscow",
    }
  );
};
