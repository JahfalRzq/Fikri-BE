import { Router } from "express"

import {
  createTrainingCoach,
  deleteTrainingCoach,
  getAllTrainingCoaches,
  getTrainingCoachById,
  updateTrainingCoach,
} from "@/controller/admin/trainingManagement/trainingCoachController"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/get-all-training-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllTrainingCoaches,
])
router.get("/get-training-coach-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getTrainingCoachById,
])
router.post("/create-training-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  createTrainingCoach,
])
router.put("/update-training-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateTrainingCoach,
])
router.delete("/delete-training-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteTrainingCoach,
])

export default router
