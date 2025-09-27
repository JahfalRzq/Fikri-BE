import { Router } from "express";
import SeederRoute from "./seederRoute";
import AuthRoute from "./authRoute";
import TrainingRoute from "./trainingRoute";
import ParticipantRoute from "./participantRoute";
import DashboardData from "./dashboard";
import setting from "./settingRoute"
import TrainingCoachRoute from "./trainingCoachRoute";
import TrainingCategoryRoute from "./trainingCategoryRoute";
import UserManagementRoute from "./userManagementRoute"


const router = Router();
router.use("/seeder", SeederRoute);
router.use("/auth", AuthRoute);
router.use("/training", TrainingRoute);
router.use("/user-management", UserManagementRoute);
router.use("/participant", ParticipantRoute);
router.use("/dashboard", DashboardData);
router.use("/setting", setting);
router.use("/training-coach", TrainingCoachRoute);
router.use("/training-category", TrainingCategoryRoute);



export default router;
