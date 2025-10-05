import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { participant, statusTraining } from "@/model/participant";
import { successResponse } from "@/utils/response";

const participantRepository = AppDataSource.getRepository(participant);

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Query untuk mendapatkan jumlah total peserta
    const totalParticipants = await participantRepository.count();

    // Query untuk mendapatkan jumlah peserta dengan status "sedangBerlangsung"
    const participantsSedangBerlangsung = await participantRepository.countBy({
      status: statusTraining.sedangBerlangsung,
    });

    // Query untuk mendapatkan jumlah peserta dengan status "selesai"
    const participantsSelesai = await participantRepository.countBy({
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
