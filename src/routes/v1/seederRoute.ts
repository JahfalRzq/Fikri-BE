import { Router } from 'express'
import { userSeeder } from '../../controller/seeder/userSeeder'

const router = Router()

router.get('/userSeeder', userSeeder)

export default router
