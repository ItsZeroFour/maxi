import express from "express";
import { UserControllers } from "../controllers/index.js";
import checkAuth from "../utils/checkAuth.js";

const router = express.Router();

router.post("/addAttempts", checkAuth, UserControllers.addAttempts);

export default router;
