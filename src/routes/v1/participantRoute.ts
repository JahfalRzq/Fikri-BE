import { Router } from 'express'
import {
    getAllParticipant,
    getParticipanttById,
    getParticipantsByTrainingId,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    changeStatusParticipant
} from '../../controller/admin/participantManagement/participantManagementController'
import { authMiddleware, onlyAdminMiddleware } from '../../middleware/authMiddleware'


const router = Router()

router.get('/get-all-participant', [authMiddleware, onlyAdminMiddleware,getAllParticipant])
router.get('/get-participant-by-id/:id', [authMiddleware, getParticipanttById])
router.get('/get-participant-by-training-id/:id', [authMiddleware, getParticipantsByTrainingId])
router.post('/create-participant', [authMiddleware, onlyAdminMiddleware, createParticipant])
router.put('/update-participant/:id', [authMiddleware, onlyAdminMiddleware, updateParticipant])
router.delete('/delete-participant/:id', [authMiddleware, onlyAdminMiddleware, deleteParticipant])
router.put('/change-status-participant/:id', [authMiddleware, onlyAdminMiddleware, changeStatusParticipant])



export default router
