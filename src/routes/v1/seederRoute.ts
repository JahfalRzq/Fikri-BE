import { Router } from "express";
import { userSeeder } from "@/controller/seeder/userSeeder";
import { trainingSeeder } from "@/controller/seeder/trainingSeeder";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware";

const router = Router();

router.get("/userSeeder", userSeeder);

router.get("/trainingSeeder", [
    authMiddleware,
    onlyAdminMiddleware,
    trainingSeeder
]);


export default router;
