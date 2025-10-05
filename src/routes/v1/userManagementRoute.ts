import { Router } from "express"

import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "@/controller/admin/userManagment/userManagementController"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/get-all-user", [authMiddleware, onlyAdminMiddleware, getAllUsers])
router.get("/get-user-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getUserById,
])
router.post("/create-user", [authMiddleware, onlyAdminMiddleware, createUser])
router.put("/update-user/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateUser,
])
router.delete("/delete-user/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteUser,
])

export default router
