import { Router } from "express";
import {
  getCertificatesByTrainingId,
  updateCertificate,
 
} from "@/controller/certificate/certificate-controller";

 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

const router = Router();

router.get("/get-certificate-by-training-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getCertificatesByTrainingId,
]);
router.put("/udpate-certificate-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateCertificate,
]);

export default router;
