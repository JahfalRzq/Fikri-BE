import { Router } from "express";
import { userSeeder } from "@/controller/seeder/userSeeder";
import { trainingSeeder } from "@/controller/seeder/trainingSeeder";
import { participantSeeder } from "@/controller/seeder/particpantSeeder";
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

router.get("/participantSeeder", [
    authMiddleware,
    onlyAdminMiddleware,
    participantSeeder
]);

export default router;
