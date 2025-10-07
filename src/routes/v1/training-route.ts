import { Router } from "express";
import {
  getAllTraining,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  restoreTraining
} from "@/controller/admin/training-management/training-management-controller";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

const router = Router();

router.get("/get-all-training", [
  authMiddleware,
  getAllTraining,
]);
router.get("/get-training-by-id/:id", [
  authMiddleware,
  getTrainingById,
]);
router.post("/create-training", [
  authMiddleware,
  onlyAdminMiddleware,
  createTraining,
]);
router.put("/update-training/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateTraining,
]);
router.delete("/delete-training/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteTraining,
]);
router.delete("/restore-training/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  restoreTraining,
]);

export default router;
