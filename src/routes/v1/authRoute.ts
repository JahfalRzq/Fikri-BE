import { Router } from "express";
import { login, fetch, register } from "@/controller/auth/authController";
const router = Router();
import { authMiddleware } from "@/middleware/authMiddleware";

router.post("/login", login);
router.get("/fetch", [authMiddleware, fetch]);
router.post("/register", register);


export default router;
