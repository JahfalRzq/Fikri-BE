import { Router } from "express";
import { userSeeder } from "@/controller/seeder/user-seeder";
import { trainingSeeder } from "@/controller/seeder/training-seeder";
import { participantSeeder } from "@/controller/seeder/particpant-seeder";
import { masterSeeder } from "@/controller/seeder/master-seeder";
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/auth-middleware";

const router = Router();

router.get("/userSeeder", userSeeder);

router.get("/masterSeeder", masterSeeder);


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
