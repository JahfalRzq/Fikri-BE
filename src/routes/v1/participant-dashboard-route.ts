import { Router } from "express";
import {
  getCertificateById,
  getCertificatesByLoggedInParticipant,
 
} from "@/controller/participant/participant-dashboard";

 import {
  authMiddleware,
  onlyParticipantMiddleware,
} from "@/middleware/auth-middleware";

const router = Router();

router.get("/get-certificate", [
  authMiddleware,
  onlyParticipantMiddleware,
  getCertificatesByLoggedInParticipant,
]);
router.get("/get-certificate-by-id/:id", [
  authMiddleware,
  onlyParticipantMiddleware,
  getCertificateById,
]);

export default router;
