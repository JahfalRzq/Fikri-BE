import { Router } from "express";
import {
  getAllTraining,
  getTrainingtById,
  createTraining,
  updateTraining,
  deleteTraining,
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
  getTrainingtById,
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

export default router;
