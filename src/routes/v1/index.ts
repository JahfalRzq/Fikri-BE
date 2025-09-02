import { Router } from 'express'
import SeederRoute from './seederRoute'
import AuthRoute from './authRoute'
import TrainingRoute from './trainingRoute'





const router = Router()
router.use('/seeder',SeederRoute)
router.use('/auth',AuthRoute)
router.use('/training',TrainingRoute)





export default router
