import { Router } from "express";
import {
  getCertificatesByTrainingId,
  publishCertificates,
  getCertificateByNoLicense
 
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
router.put("/publish", [
  authMiddleware,
  onlyAdminMiddleware,
  publishCertificates,
]);

router.get("/get-certificate-by-no-license/:noLicense", [
  getCertificateByNoLicense,
]);


export default router;
