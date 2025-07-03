import express from "express";
import { UserControllers } from "../controllers/index.js";

const router = express.Router();

router.post("/auth", UserControllers.userAuthorization);
router.get("/get", UserControllers.userGet);

export default router;
