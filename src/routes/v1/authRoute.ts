import { Router } from "express"

import { fetch, login, register } from "@/controller/auth/authController"
import { authMiddleware } from "@/middleware/authMiddleware"

const router = Router()

router.post("/login", login)
router.get("/fetch", [authMiddleware, fetch])
router.post("/register", register)

export default router
