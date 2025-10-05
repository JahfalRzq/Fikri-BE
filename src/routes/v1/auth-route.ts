import { Router } from "express";
import { login, fetch, register } from "@/controller/auth/auth-controller";
const router = Router();
import { authMiddleware } from "@/middleware/auth-middleware";

router.post("/login", login);
router.get("/fetch", [authMiddleware, fetch]);
router.post("/register", register);


export default router;
