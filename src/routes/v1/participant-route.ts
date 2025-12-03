import { Router } from "express";
import {
  getAllParticipant,
  getParticipantById,
  getParticipantsByTrainingId,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  changeStatusParticipant,
  restoreParticipant,
  getArchivedParticipantsByTrainingId,
  bulkUploadParticipants
} from "@/controller/admin/participant-management/participant-management-controller";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.get("/get-all-participant", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllParticipant,
]);
router.get("/get-participant-by-id/:id", [
  authMiddleware, 
  getParticipantById
]);
router.get("/get-participant-by-training-id/:id", [
  authMiddleware,
  getParticipantsByTrainingId,
]);
router.get("/get-archive-participant-by-training-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getArchivedParticipantsByTrainingId,
]);
router.post("/create-participant", [
  authMiddleware,
  onlyAdminMiddleware,
  createParticipant,
]);
router.put("/update-participant/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateParticipant,
]);
router.delete(  "/delete-participant/:trainingId/:participantId",
[
  authMiddleware,
  onlyAdminMiddleware,
  deleteParticipant,
]);
router.put("/change-status-participant/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  changeStatusParticipant,
]);
router.put("/restore-participant/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  restoreParticipant,
]);
router.post("/bulk-upload-participant", [
  upload.single('file'),
  authMiddleware,
  bulkUploadParticipants,
]);
export default router;
