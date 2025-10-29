import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { successResponse, errorResponse } from "@/utils/response";
import { statusTraining } from "@/model/training-participant";
import { trainingParticipant } from "@/model/training-participant";
import { participant } from "@/model/participant";
import { certificate } from "@/model/certificate";

// Repositori yang kita butuhkan
const trainingParticipantRepository = AppDataSource.getRepository(trainingParticipant);
const participantRepository = AppDataSource.getRepository(participant);
const certificateRepository = AppDataSource.getRepository(certificate);

export const getCertificatesByLoggedInParticipant = async (req: Request, res: Response) => {
  try {
    // Mengambil ID dari 'jwtPayload' (Ini sudah benar)
    const loggedInUserId = (req as any).jwtPayload?.id;

    if (!loggedInUserId) {
      return res.status(401).send(errorResponse("User not authenticated or JWT payload missing", 401));
    }

    // 1. Dapatkan parameter query
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    // 2. Cari ID partisipan (Ini sudah benar)
    const userParticipant = await participantRepository.findOne({
      where: {
        user: { id: loggedInUserId },
      },
      select: ["id"], 
    });

    if (!userParticipant) {
      return res.status(403).send(errorResponse("Participant profile not found for this user", 403));
    }
    
    const participantId = userParticipant.id;

    // ====================================================================
    // PERBAIKAN LOGIKA QUERY: Mulai dari 'certificate'
    // ====================================================================
    const queryBuilder = certificateRepository
      .createQueryBuilder("certificate")
      // Join ke trainingParticipant (menggunakan certificate.trainingParticipantId)
      .leftJoinAndSelect("certificate.trainingParticipant", "tp")
      // Dari tp, join ke participant
      .leftJoinAndSelect("tp.participant", "participant")
      // Dari tp, join ke training
      .leftJoinAndSelect("tp.training", "training")
      .orderBy("certificate.createdAt", "DESC");

    // 4. Terapkan filter utama
    // Filter berdasarkan ID partisipan yang kita temukan
    queryBuilder.where("participant.id = :participantId", { participantId });
    // Filter "IS NOT NULL" tidak lagi diperlukan karena kita mulai dari 'certificate'

    // 5. Terapkan filter opsional (status dan search)
    if (status && Object.values(statusTraining).includes(status as statusTraining)) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    if (search) {
      queryBuilder.andWhere(
        `(training.trainingName LIKE :search OR
          certificate.noLiscense LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // 6. Dapatkan total data dan lakukan pagination
    const [certificates, totalCount] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 7. Transformasi hasil (data sudah dalam format sertifikat)
    const certificateData = certificates.map((cert) => {
      // Pastikan relasi ada sebelum mengaksesnya
      const tp = cert.trainingParticipant;
      const participant = tp?.participant;
      const training = tp?.training;

      return {
        id: cert.id,
        imageUrl: cert.imageUrl,
        noLiscense: cert.noLiscense,
        expiredAt: cert.expiredAt,
        createdAt: cert.createdAt,
        // Data relasi yang digabungkan
        trainingParticipant: {
          id: tp?.id || null,
          status: tp?.status || null,
          participant: {
            id: participant?.id || null,
            firstName: participant?.firstName || null,
            lastName: participant?.lastName || null,
          },
          training: {
            id: training?.id || null,
            trainingName: training?.trainingName || null,
          },
        },
      };
    });

    // 8. Kirim response sukses
    return res.status(200).send(
      successResponse(
        "Certificates for logged-in participant retrieved successfully",
        {
          data: certificateData,
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error: any) {
    return res.status(500).send(errorResponse(error.message, 500));
  }
};

export const getCertificateById = async (req: Request, res: Response) => {
  try {
    // 1. Ambil ID sertifikat dari parameter URL
    const { id } = req.params;

    if (!id) {
      return res.status(400).send(errorResponse("Certificate ID is required", 400));
    }

    // 2. Buat query untuk mencari sertifikat berdasarkan ID
    //    dan sertakan semua relasi detailnya
    const certificateDetail = await certificateRepository
      .createQueryBuilder("certificate")
      // Join ke data partisipasi pelatihan
      .leftJoinAndSelect("certificate.trainingParticipant", "tp")
      // Dari partisipasi, join ke data peserta
      .leftJoinAndSelect("tp.participant", "participant")
      // Dari partisipasi, join ke data pelatihan
      .leftJoinAndSelect("tp.training", "training")
      // Dari partisipasi, join ke data pelatih
      .leftJoinAndSelect("tp.coach", "coach")
      // Filter berdasarkan ID sertifikat
      .where("certificate.id = :id", { id })
      .getOne(); // Ambil satu data saja

    // 3. Handle jika sertifikat tidak ditemukan
    if (!certificateDetail) {
      return res.status(404).send(errorResponse("Certificate not found", 404));
    }

    // 4. Kirim response sukses beserta data detail
    return res.status(200).send(
      successResponse(
        "Certificate detail retrieved successfully",
        certificateDetail, // Kirim seluruh objek hasil join
        200
      )
    );
  } catch (error: any) {
    // 5. Handle error internal server
    return res.status(500).send(errorResponse(error.message, 500));
  }
};