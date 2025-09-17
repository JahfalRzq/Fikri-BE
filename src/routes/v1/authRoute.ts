import { Router } from 'express'
import { login,fetch } from '../../controller/auth/authController'
const router = Router()
import { authMiddleware } from '../../middleware/authMiddleware'


router.post('/login', login)
router.get('/fetch', [authMiddleware ,fetch])

export default router
