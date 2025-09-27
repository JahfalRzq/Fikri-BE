import { Router } from "express";
import { 
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
 } from "@/controller/admin/userManagment/userManagementController";

const router = Router();


 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware";

router.get("/get-all-user", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllUsers,
]);
router.get("/get-user-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getUserById,
]);
router.post("/create-user", [
  authMiddleware,
  onlyAdminMiddleware,
  createUser,
]);
router.put("/update-user/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateUser,
]);
router.delete("/delete-user/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteUser,
]);

export default router;

