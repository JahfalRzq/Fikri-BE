import { Router } from "express"

import {
  createCategoryTraining,
  deleteCategoryTraining,
  getAllCategoryTrainings,
  getCategoryTrainingById,
  updateCategoryTraining,
} from "@/controller/admin/trainingManagement/categoryTrainingController"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/get-all-training-category", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllCategoryTrainings,
])
router.get("/get-training-category-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getCategoryTrainingById,
])
router.post("/create-training-category", [
  authMiddleware,
  onlyAdminMiddleware,
  createCategoryTraining,
])
router.put("/update-training-category/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateCategoryTraining,
])
router.delete("/delete-training-category/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteCategoryTraining,
])

export default router
