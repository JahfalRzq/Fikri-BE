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

router.get('/get-all-participant', [checkJwt,getAllParticipant])
router.get('/get-participant-by-id/:id', [checkJwt,getParticipanttById])
router.post('/create-participant', [checkJwt,createParticipant])
router.put('/update-participant/:id', [checkJwt,updateParticipant])
router.delete('/delete-participant/:id', [checkJwt,deleteParticipant])
router.put('/change-status-participant/:id', [checkJwt,changeStatusParticipant])



export default router
