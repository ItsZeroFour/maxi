import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const BOOSTER_TYPES = [
  "impulse_line4_horizont",
  "impulse_line4_vertical",
  "vspyshka_line5",
  "prizma_gt",
];

export const adminLogin = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ message: "Введите логин и пароль" });
    }

    if (
      login !== process.env.ADMIN_LOGIN ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({ message: "Неверный логин или пароль" });
    }

    const token = jwt.sign(
      { role: "admin", login },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({ token });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Ошибка сервера при входе" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const filter = search
      ? { user_token: { $regex: search, $options: "i" } }
      : {};

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const formatted = users.map((u) => ({
      user_token: u.user_token,
      default_attempts: u.default_attempts,
      maxi_attempts: u.maxi_attempts,
      boosters: u.boosters,
      promo_codes_count: u.promo_codes?.length || 0,
      activated_promo_codes_count: u.activated_promo_codes?.length || 0,
      completed_levels_count: u.completedLevels?.length || 0,
      onbording_complete: u.onbording_complete,
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      users: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Ошибка получения пользователей" });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ user_token: token }).lean();

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Ошибка получения пользователя" });
  }
};

export const getLevelsStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const stats = await User.aggregate([
      { $unwind: "$completedLevels" },
      {
        $group: {
          _id: "$completedLevels.level",
          completions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = stats.map((s) => ({
      level: s._id,
      completions: s.completions,
      completionRate:
        totalUsers > 0 ? +((s.completions / totalUsers) * 100).toFixed(1) : 0,
    }));

    return res.status(200).json({ totalUsers, levels: formatted });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения статистики уровней" });
  }
};

export const getPromocodesStats = async (req, res) => {
  try {
    const issued = await User.aggregate([
      { $unwind: "$promo_codes" },
      { $group: { _id: "$promo_codes", issuedCount: { $sum: 1 } } },
    ]);

    const activated = await User.aggregate([
      { $unwind: "$activated_promo_codes" },
      {
        $group: { _id: "$activated_promo_codes", activatedCount: { $sum: 1 } },
      },
    ]);

    const activatedMap = Object.fromEntries(
      activated.map((a) => [a._id, a.activatedCount]),
    );

    const combined = issued
      .map((i) => ({
        promocode: i._id,
        issued: i.issuedCount,
        activated: activatedMap[i._id] || 0,
      }))
      .sort((a, b) => b.issued - a.issued);

    const totalIssued = combined.reduce((sum, c) => sum + c.issued, 0);
    const totalActivated = combined.reduce((sum, c) => sum + c.activated, 0);

    return res.status(200).json({
      totalIssued,
      totalActivated,
      activationRate:
        totalIssued > 0
          ? +((totalActivated / totalIssued) * 100).toFixed(1)
          : 0,
      promocodes: combined,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения статистики промокодов" });
  }
};

export const getOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const onboardedUsers = await User.countDocuments({
      onbording_complete: true,
    });

    const registrationsByDay = await User.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const attemptsByDay = await User.aggregate([
      { $unwind: "$attemptsAccrual" },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$attemptsAccrual.accrualAt",
            },
          },
          count: { $sum: "$attemptsAccrual.count" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const boostersByDay = await User.aggregate([
      { $unwind: "$boostersAccrual" },
      {
        $group: {
          _id: {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$boostersAccrual.accrualAt",
              },
            },
            type: "$boostersAccrual.type",
          },
          count: { $sum: "$boostersAccrual.count" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    const boostersTotals = await User.aggregate([
      {
        $group: {
          _id: null,
          impulse_line4_horizont: { $sum: "$boosters.impulse_line4_horizont" },
          impulse_line4_vertical: { $sum: "$boosters.impulse_line4_vertical" },
          vspyshka_line5: { $sum: "$boosters.vspyshka_line5" },
          prizma_gt: { $sum: "$boosters.prizma_gt" },
        },
      },
    ]);

    return res.status(200).json({
      totalUsers,
      onboardedUsers,
      onboardingRate:
        totalUsers > 0 ? +((onboardedUsers / totalUsers) * 100).toFixed(1) : 0,
      registrationsByDay: registrationsByDay.map((r) => ({
        date: r._id,
        count: r.count,
      })),
      attemptsByDay: attemptsByDay.map((a) => ({
        date: a._id,
        count: a.count,
      })),
      boostersByDay: boostersByDay.map((b) => ({
        date: b._id.day,
        type: b._id.type,
        count: b.count,
      })),
      boostersTotals: boostersTotals[0]
        ? {
            impulse_line4_horizont: boostersTotals[0].impulse_line4_horizont,
            impulse_line4_vertical: boostersTotals[0].impulse_line4_vertical,
            vspyshka_line5: boostersTotals[0].vspyshka_line5,
            prizma_gt: boostersTotals[0].prizma_gt,
          }
        : {
            impulse_line4_horizont: 0,
            impulse_line4_vertical: 0,
            vspyshka_line5: 0,
            prizma_gt: 0,
          },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения общей статистики" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { token } = req.params;
    const { default_attempts, maxi_attempts, boosters, onbording_complete } =
      req.body;

    const update = {};

    if (default_attempts !== undefined) {
      if (typeof default_attempts !== "number" || default_attempts < 0) {
        return res
          .status(400)
          .json({ message: "Неверное значение default_attempts" });
      }
      update.default_attempts = default_attempts;
    }

    if (maxi_attempts !== undefined) {
      if (typeof maxi_attempts !== "number" || maxi_attempts < 0) {
        return res
          .status(400)
          .json({ message: "Неверное значение maxi_attempts" });
      }
      update.maxi_attempts = maxi_attempts;
    }

    if (onbording_complete !== undefined) {
      update.onbording_complete = !!onbording_complete;
    }

    if (boosters !== undefined) {
      for (const [type, count] of Object.entries(boosters)) {
        if (!BOOSTER_TYPES.includes(type)) {
          return res
            .status(400)
            .json({ message: `Неизвестный тип бустера: ${type}` });
        }
        if (typeof count !== "number" || count < 0) {
          return res
            .status(400)
            .json({ message: `Неверное количество для ${type}` });
        }
        update[`boosters.${type}`] = count;
      }
    }

    const user = await User.findOneAndUpdate(
      { user_token: token },
      { $set: update },
      { new: true },
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Ошибка обновления пользователя" });
  }
};
