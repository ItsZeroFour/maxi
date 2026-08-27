// server/routes/QuizRoutes.js
import express from "express";
import checkToken from "../utils/checkToken.js";
import {
  getQuizStatus,
  getQuizQuestion,
  submitQuiz,
} from "../controllers/QuizControllers.js";

const router = express.Router();

router.get("/status", checkToken, getQuizStatus);

router.get("/", checkToken, getQuizQuestion);

router.post("/submit", checkToken, submitQuiz);

export default router;