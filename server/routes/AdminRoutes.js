import { Router } from "express";
import { checkAdminToken } from "../utils/checkAdminToken.js";
import {
  adminLogin,
  getUsers,
  getUserDetails,
  getUserLogs,
  getLevelsStats,
  getPromocodesStats,
  getOverview,
  updateUser,
  exportUsersCsv,
} from "../controllers/AdminControllers.js";
import {
  getQuizQuestionsAdmin,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "../controllers/AdminQuizControllers.js";

const router = Router();

router.post("/login", adminLogin);

router.get("/users", checkAdminToken, getUsers);
router.get("/users/export/csv", checkAdminToken, exportUsersCsv);
router.get("/users/:token", checkAdminToken, getUserDetails);
router.get("/users/:token/logs", checkAdminToken, getUserLogs);
router.get("/stats/levels", checkAdminToken, getLevelsStats);
router.get("/stats/promocodes", checkAdminToken, getPromocodesStats);
router.get("/stats/overview", checkAdminToken, getOverview);
router.put("/users/:token", checkAdminToken, updateUser);

router.get("/quiz", checkAdminToken, getQuizQuestionsAdmin);
router.post("/quiz", checkAdminToken, createQuizQuestion);
router.put("/quiz/:id", checkAdminToken, updateQuizQuestion);
router.delete("/quiz/:id", checkAdminToken, deleteQuizQuestion);

export default router;
