import { Router } from "express";
import { checkAdminToken } from "../utils/checkAdminToken.js";
import {
  adminLogin,
  getUsers,
  getUserDetails,
  getLevelsStats,
  getPromocodesStats,
  getOverview,
  updateUser,
} from "../controllers/AdminControllers.js";

const router = Router();

router.post("/login", adminLogin);

router.get("/users", checkAdminToken, getUsers);
router.get("/users/:token", checkAdminToken, getUserDetails);
router.get("/stats/levels", checkAdminToken, getLevelsStats);
router.get("/stats/promocodes", checkAdminToken, getPromocodesStats);
router.get("/stats/overview", checkAdminToken, getOverview);
router.put("/users/:token", checkAdminToken, updateUser);

export default router;
