import { Router } from "express";
import { 
    getAllCoaches,
    getCoachById,
    createCoach,
    updateCoach,
    deleteCoach,
    bulkCreateCoaches
 } from "@/controller/admin/training-management/coach-controller";

 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });


const router = Router();

router.get("/get-all-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllCoaches,
]);
router.get("/get-coach-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getCoachById,
]);
router.post("/create-coach", [
  authMiddleware,
  onlyAdminMiddleware,
  createCoach,
]);
router.put("/update-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateCoach,
]);
router.delete("/delete-coach/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteCoach,
]);

router.post("/bulk-upload", [
  upload.single('file'),
  bulkCreateCoaches,
]);

export default router;

