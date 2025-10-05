import { Router } from "express";
import { 
    getAllTrainingCoaches,
    getTrainingCoachById,
    createTrainingCoach,
    updateTrainingCoach,
    deleteTrainingCoach
 } from "@/controller/admin/training-management/training-coach-controller";

 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";


const router = Router();

router.get("/get-all-training-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllTrainingCoaches,
]);
router.get("/get-training-coach-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getTrainingCoachById,
]);
router.post("/create-training-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  createTrainingCoach,
]);
router.put("/update-training-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateTrainingCoach,
]);
router.delete("/delete-training-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteTrainingCoach,
]);

export default router;

