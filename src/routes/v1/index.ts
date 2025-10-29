import { Router } from "express";
import SeederRoute from "./seeder-route";
import AuthRoute from "./auth-route";
import TrainingRoute from "./training-route";
import ParticipantRoute from "./participant-route";
import DashboardData from "./dashboard";
import setting from "./setting-route"
import CoachRoute from "./coach-route";
import CategoryRoute from "./category-route";
import UserManagementRoute from "./user-management-route"
import CertificateManagementRoute from './certficate-route'
import participantDashboard from './participant-dashboard-route'

const router = Router();
router.use("/seeder", SeederRoute);
router.use("/auth", AuthRoute);
router.use("/training", TrainingRoute);
router.use("/user-management", UserManagementRoute);
router.use("/participant", ParticipantRoute);
router.use("/dashboard", DashboardData);
router.use("/setting", setting);
router.use("/coach", CoachRoute);
router.use("/category", CategoryRoute);
router.use("/certificate", CertificateManagementRoute);
router.use("/participant-dashboard", participantDashboard);





export default router;
