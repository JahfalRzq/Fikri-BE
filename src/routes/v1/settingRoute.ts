import { Router } from "express"

import {
  updateAdminProfile,
  updateParticipantProfile,
} from "@/controller/setting/userProfileManagementController"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.put("/edit-participant-profile/:id", [
  authMiddleware,
  updateParticipantProfile,
])

router.put("/edit-admin-profile/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateAdminProfile,
])

export default router
