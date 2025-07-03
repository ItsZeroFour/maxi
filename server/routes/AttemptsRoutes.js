import express from "express";
import { UserControllers } from "../controllers/index.js";

const router = express.Router();

router.post("/addAttempts", UserControllers.addAttempts);

export default router;
