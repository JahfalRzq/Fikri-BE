import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { participant } from "@/model/participant";
import { trainingParticipant,statusTraining } from "@/model/training-participant";
import { successResponse } from "@/utils/response";

const participantRepository = AppDataSource.getRepository(participant);
const participantTrainingRepository = AppDataSource.getRepository(trainingParticipant);


export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Query untuk mendapatkan jumlah total peserta
    const totalParticipants = await participantTrainingRepository.count();

    // Query untuk mendapatkan jumlah peserta dengan status "sedangBerlangsung"
    const participantsSedangBerlangsung = await participantTrainingRepository.countBy({
      status: statusTraining.sedangBerlangsung,
    });

    // Query untuk mendapatkan jumlah peserta dengan status "selesai"
    const participantsSelesai = await participantTrainingRepository.countBy({
      status: statusTraining.selesai,
    });

    const dashboardData = {
      totalParticipants,
      participantsSedangBerlangsung,
      participantsSelesai,
    };

    return res
      .status(200)
      .send(
        successResponse(
          "Dashboard data retrieved successfully",
          { data: dashboardData },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

