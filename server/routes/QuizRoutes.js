import express from "express";
import checkToken from "../utils/checkToken.js";
import {
  getQuizStatus,
  getQuizQuestions,
  submitQuiz,
} from "../controllers/QuizControllers.js";

const router = express.Router();

router.get("/status", checkToken, getQuizStatus);

router.get("/", checkToken, getQuizQuestions);

router.post("/submit", checkToken, submitQuiz);

export default router;
