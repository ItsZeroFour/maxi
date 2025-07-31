import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkAuth from "../utils/checkAuth.js";
import checkToken from "../utils/checkToken.js";

const router = express.Router();

router.post("/auth", checkAuth, UserControllers.userAuthorization);
router.get("/get", UserControllers.userGet);
router.post("/level-complete/:level", checkToken, UserControllers.levelComplete)
router.post("/complete-onbording", checkToken, UserControllers.completeOnbording)
router.post("/activate-promocode", checkToken, UserControllers.activatePromocode)

export default router;
