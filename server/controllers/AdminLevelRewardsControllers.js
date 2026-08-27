import LevelReward, { BOOSTER_TYPES } from "../models/LevelReward.js";

export const getLevelRewards = async (req, res) => {
  try {
    const rewards = await LevelReward.find({}).sort({ level: 1 });
    return res.status(200).json({ rewards });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка получения наград по уровням" });
  }
};

export const upsertLevelReward = async (req, res) => {
  try {
    const level = Number(req.params.level);
    const { rewardType, promocode, boosterType } = req.body;

    if (!Number.isInteger(level) || level < 1) {
      return res.status(400).json({ message: "Неверный номер уровня" });
    }

    if (!["promocode", "booster"].includes(rewardType)) {
      return res.status(400).json({ message: "Неверный тип приза" });
    }

    const setFields = { level, rewardType };
    const unsetFields = {};

    if (rewardType === "promocode") {
      if (!promocode || !String(promocode).trim()) {
        return res.status(400).json({ message: "Укажите текст промокода" });
      }
      setFields.promocode = String(promocode).trim();
      unsetFields.boosterType = "";
    } else {
      if (!BOOSTER_TYPES.includes(boosterType)) {
        return res
          .status(400)
          .json({ message: "Укажите корректный тип бустера" });
      }
      setFields.boosterType = boosterType;
      unsetFields.promocode = "";
    }

    const saved = await LevelReward.findOneAndUpdate(
      { level },
      { $set: setFields, $unset: unsetFields },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    );

    return res.status(200).json({ reward: saved });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка сохранения награды за уровень" });
  }
};

export const deleteLevelReward = async (req, res) => {
  try {
    const level = Number(req.params.level);
    const deleted = await LevelReward.findOneAndDelete({ level });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Настройка для этого уровня не найдена" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Ошибка сброса награды за уровень" });
  }
};
