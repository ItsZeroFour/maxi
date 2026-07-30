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

export default router;
