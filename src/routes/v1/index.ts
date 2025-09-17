import { Router } from "express";
import SeederRoute from "./seederRoute";
import AuthRoute from "./authRoute";
import TrainingRoute from "./trainingRoute";
import ParticipantRoute from "./participantRoute";
import DashboardData from "./dashboard";

const router = Router();
router.use("/seeder", SeederRoute);
router.use("/auth", AuthRoute);
router.use("/training", TrainingRoute);
router.use("/participant", ParticipantRoute);
router.use("/dashboard", DashboardData);

export default router;
