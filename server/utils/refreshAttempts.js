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

        const result = await User.updateMany({}, [
          {
            $set: {
              default_attempts: 2,
            },
          },
        ]);

        console.log(
          `Daily reset completed. Affected users: ${result.modifiedCount}\n` +
            `- default_attempts сброшен до 2`
        );
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
