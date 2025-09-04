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

router.get('/get-all-training', [checkJwt,getAllTraining])
router.get('/get-training-by-id/:id', [checkJwt,getTrainingtById])
router.post('/create-training', [checkJwt,createTraining])
router.put('/update-training/:id', [checkJwt,updateTraining])
router.delete('/update-training/:id', [checkJwt,deleteTraining])


export default router
