import { Router } from "express";
import { 
    getAllCategory,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
 } from "@/controller/admin/training-management/category-controller";

 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";


const router = Router();

router.get("/get-all-category", [
  authMiddleware,
  onlyAdminMiddleware,
  getAllCategory,
]);
router.get("/get-category-by-id/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  getCategoryById,
]);
router.post("/create-category", [
  authMiddleware,
  onlyAdminMiddleware,
  createCategory,
]);
router.put("/update-category/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  updateCategory,
]);
router.delete("/delete-category/:id", [
  authMiddleware,
  onlyAdminMiddleware,
  deleteCategory,
]);

export default router;

