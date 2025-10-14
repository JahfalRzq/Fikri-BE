import { Router } from "express";
import { 
    getAllCategory,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkCreateCategories
 } from "@/controller/admin/training-management/category-controller";

 import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });



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

router.post("/bulk-upload", [
  upload.single('file'),
  bulkCreateCategories,
]);


export default router;

