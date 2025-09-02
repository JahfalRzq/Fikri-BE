import { Router } from 'express'
import SeederRoute from './seederRoute'
import AuthRoute from './authRoute'





const router = Router()
router.use('/seeder',SeederRoute)
router.use('/auth',AuthRoute)




export default router
