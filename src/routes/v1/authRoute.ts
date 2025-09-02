import { Router } from 'express'
import { login,fetch } from '../../controller/Auth/authController'
const router = Router()
import { checkJwt } from '../../utils/checkJwt'


router.post('/login', login)
router.get('/fetch', [checkJwt ,fetch])

export default router
