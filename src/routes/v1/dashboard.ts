import { Router } from 'express'
import { getDashboardData } from '../../controller/admin/dashboard/dashboardData'
import { checkJwt } from '../../utils/checkJwt'

const router = Router()

router.get('/dashboard-data', [checkJwt ,getDashboardData])

export default router
