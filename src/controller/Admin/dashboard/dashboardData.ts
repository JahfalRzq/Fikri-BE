import { Request, Response } from "express";
import { AppDataSource } from "../../../data-source";
import { user, UserRole } from "../../../model/user";
import { participant, statusTraining } from "../../../model/participant";

const { successResponse, errorResponse, validationResponse } = require('../../../utils/response');

const participantRepository = AppDataSource.getRepository(participant);
const userRepository = AppDataSource.getRepository(user);

export const getDashboardData = async (req: Request, res: Response) => {
    try {
        const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
        if (!userAccess || userAccess.role !== UserRole.ADMIN) {
            return res.status(403).send(errorResponse("Access Denied: Only ADMIN can access dashboard", 403));
        }

        // Query untuk mendapatkan jumlah total peserta
        const totalParticipants = await participantRepository.count();

        // Query untuk mendapatkan jumlah peserta dengan status "sedangBerlangsung"
        const participantsSedangBerlangsung = await participantRepository.countBy({
            status: statusTraining.sedangBerlangsung
        });

        // Query untuk mendapatkan jumlah peserta dengan status "selesai"
        const participantsSelesai = await participantRepository.countBy({
            status: statusTraining.selesai
        });

        const dashboardData = {
            totalParticipants,
            participantsSedangBerlangsung,
            participantsSelesai
        };

        return res.status(200).send(successResponse("Dashboard data retrieved successfully", { data: dashboardData }, 200));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};