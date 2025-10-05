import { Router } from "express"

import {
  createTraining,
  deleteTraining,
  getAllTraining,
  getTrainingtById,
  updateTraining,
} from "@/controller/admin/trainingManagement/trainingManagementController"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/get-all-training", [authMiddleware, getAllTraining])
router.get("/get-training-by-id/:id", [authMiddleware, getTrainingtById])
router.post("/create-training", [
  authMiddleware,
  onlyAdminMiddleware,
  createTraining,
])
router.put("/update-training/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateTraining,
])
router.delete("/delete-training/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteTraining,
])

export default router
