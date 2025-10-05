import { Router } from "express"

import { getDashboardData } from "@/controller/admin/dashboard/dashboardData"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/dashboard-data", [
  authMiddleware,
  onlyAdminMiddleware,
  getDashboardData,
])

export default router
