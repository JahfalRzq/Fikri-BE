
import { Router } from "express";
import { 
    updateParticipantProfile,
    updateAdminProfile
    } from "@/controller/setting/user-profile-management-controller";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

const router = Router();


router.put("/edit-participant-profile/:id", [
    authMiddleware,
    updateParticipantProfile
]);

router.put("/edit-admin-profile/:id", [
    authMiddleware,
    onlyAdminMiddleware,
    updateAdminProfile
]);

export default router;

    