import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkAuth from "../utils/checkAuth.js";

const router = express.Router();

router.post("/auth", UserControllers.userAutharization);
router.get("/get", UserControllers.userGet);
router.patch("/addAttempts", UserControllers.addAttempts);

export default router;
