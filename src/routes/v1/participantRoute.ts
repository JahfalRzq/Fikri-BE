import { Router } from 'express'
import { 
    getAllParticipant,
    getParticipanttById,
    createParticipant,
    updateParticipant,
    deleteParticipant,
    changeStatusParticipant

    } from '../../controller/admin/participantManagement/participantManagementController'
import { checkJwt } from '../../utils/checkJwt'


const router = Router()

router.get('/get-all-participant', [getAllParticipant,checkJwt])
router.get('/get-participant-by-id/:id', [getParticipanttById,checkJwt])
router.post('/create-participant', [createParticipant,checkJwt])
router.put('/update-participant/:id', [updateParticipant,checkJwt])
router.delete('/update-participant/:id', [deleteParticipant,checkJwt])
router.delete('/change-status-participant/:id', [changeStatusParticipant,checkJwt])



export default router
