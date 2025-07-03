import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkAuth from "../utils/checkAuth.js";

const router = express.Router();

router.post("/auth", UserControllers.userAuthorization);
router.get("/get", checkAuth, UserControllers.userGet);

export default router;
