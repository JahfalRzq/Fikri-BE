import { Router } from "express"

import AuthRoute from "./authRoute"
import DashboardData from "./dashboard"
import ParticipantRoute from "./participantRoute"
import SeederRoute from "./seederRoute"
import setting from "./settingRoute"
import TrainingCategoryRoute from "./trainingCategoryRoute"
import TrainingCoachRoute from "./trainingCoachRoute"
import TrainingRoute from "./trainingRoute"
import UserManagementRoute from "./userManagementRoute"

const router = Router()
router.use("/seeder", SeederRoute)
router.use("/auth", AuthRoute)
router.use("/training", TrainingRoute)
router.use("/user-management", UserManagementRoute)
router.use("/participant", ParticipantRoute)
router.use("/dashboard", DashboardData)
router.use("/setting", setting)
router.use("/training-coach", TrainingCoachRoute)
router.use("/training-category", TrainingCategoryRoute)

export default router
