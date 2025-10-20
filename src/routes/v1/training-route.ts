import { Router } from "express";
import {
  getAllTraining,
  getTrainingById,
  createTraining,
  updateTraining,
  deleteTraining,
  restoreTraining,
  bulkCreateTrainings,
  getArchivedTrainings
} from "@/controller/admin/training-management/training-management-controller";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });


const router = Router();

router.get("/get-all-training", [
  authMiddleware,
  getAllTraining,
]);
router.get("/get-all-archived-training", [
  authMiddleware,
  getArchivedTrainings,
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
router.post("/bulk-upload", [
  // authMiddleware,
  // onlyAdminMiddleware,
  upload.single('file'),

  bulkCreateTrainings,
]);

export default router;
