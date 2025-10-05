import { Router } from "express";
import { getDashboardData } from "@/controller/admin/dashboard/dashboard-data";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

const router = Router()

router.get("/dashboard-data", [
  authMiddleware,
  onlyAdminMiddleware,
  getDashboardData,
])

export default router
