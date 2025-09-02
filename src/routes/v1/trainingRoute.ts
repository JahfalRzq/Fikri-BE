import { Router } from 'express'
import { 
    getAllTraining,
    getTrainingtById,
    createTraining,
    updateTraining,
    deleteTraining

    } from '../../controller/admin/trainingManagement/trainingManagementController'
import { checkJwt } from '../../utils/checkJwt'


const router = Router()

router.get('/get-all-training', [getAllTraining,checkJwt])
router.get('/get-training-by-id/:id', [getTrainingtById,checkJwt])
router.post('/create-training', [createTraining,checkJwt])
router.put('/update-training/:id', [updateTraining,checkJwt])
router.delete('/update-training/:id', [deleteTraining,checkJwt])


export default router
