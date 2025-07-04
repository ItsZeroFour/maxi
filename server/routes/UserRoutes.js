import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkAuth from "../utils/checkAuth.js";

const router = express.Router();

router.post("/auth", checkAuth, UserControllers.userAuthorization);
router.get("/get", UserControllers.userGet);

export default router;
