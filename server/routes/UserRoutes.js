import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkToken from "../utils/checkToken.js";

const router = express.Router();

router.post("/auth", checkToken, UserControllers.userAuthorization);
router.get("/get", checkToken, UserControllers.userGet);
router.post(
  "/level-complete/:level",
  checkToken,
  UserControllers.levelComplete,
);
router.post(
  "/complete-onbording",
  checkToken,
  UserControllers.completeOnbording,
);
router.post(
  "/activate-promocode",
  checkToken,
  UserControllers.activatePromocode,
);
router.post("/level-start", checkToken, UserControllers.levelStart);
router.post("/add-boosters", checkToken, UserControllers.addBoosters);
router.post("/use-booster", checkToken, UserControllers.useBooster);

export default router;
