import { Router } from "express"

import { participantSeeder } from "@/controller/seeder/particpantSeeder"
import { trainingSeeder } from "@/controller/seeder/trainingSeeder"
import { userSeeder } from "@/controller/seeder/userSeeder"
import {
  authMiddleware,
  onlyAdminMiddleware,
} from "@/middleware/authMiddleware"

const router = Router()

router.get("/userSeeder", userSeeder)

router.get("/trainingSeeder", [
  authMiddleware,
  onlyAdminMiddleware,
  trainingSeeder,
])

router.get("/participantSeeder", [
  authMiddleware,
  onlyAdminMiddleware,
  participantSeeder,
])

export default router
