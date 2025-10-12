import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { certificate } from "@/model/certificate";
import { successResponse, errorResponse,validationResponse } from "@/utils/response"; // Assuming you have errorResponse
import { statusTraining } from "@/model/training-participant"; // Import the enum
import Joi from "joi";
import { trainingParticipant } from "@/model/training-participant";
import { participant } from "@/model/participant"; // ✅ Kita akan mulai dari sini


const certificateRepository = AppDataSource.getRepository(certificate);
const trainingParticipantRepository = AppDataSource.getRepository(trainingParticipant);
const participantRepository = AppDataSource.getRepository(participant);


export const getCertificatesByTrainingId = async (req: Request, res: Response) => {
  try {
    const { id: trainingId } = req.params; // Ambil trainingId dari URL
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    // ✅ Query dimulai dari 'participant', meniru pola yang sudah berhasil
    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      // ✅ DITAMBAHKAN: Ini adalah join kunci untuk mendapatkan data sertifikat
      .leftJoinAndSelect("tp.certificate", "certificate")
      .orderBy("participant.createdAt", "DESC");

    // Filter utama berdasarkan trainingId
    queryBuilder.where("training.id = :trainingId", { trainingId });

    // Filter status opsional
    if (status && Object.values(statusTraining).includes(status as statusTraining)) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // Search opsional
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search OR
          participant.lastName LIKE :search OR
          participant.email LIKE :search OR
          certificate.noLiscense LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // Dapatkan total data dan lakukan pagination
    const [participants, totalCount] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

    // ✅ Transformasi hasil agar sesuai dengan apa yang dibutuhkan UI
    const certificateData = participants.map((p) => {
      // Temukan relasi trainingParticipant yang relevan untuk training ini
      const trainingInfo = p.trainingParticipant.find(
        (tp: any) => tp.training?.id === trainingId
      );

      // Buat objek response, meskipun sertifikatnya mungkin NULL
      return {
        id: trainingInfo?.certificate?.id || null, // ID Sertifikat
        imageUrl: trainingInfo?.certificate?.imageUrl || "",
        noLiscense: trainingInfo?.certificate?.noLiscense || "N/A",
        expiredAt: trainingInfo?.certificate?.expiredAt || null,
        createdAt: trainingInfo?.certificate?.createdAt || null,
        // Kita tetap sertakan data peserta & pelatihan untuk ditampilkan di tabel
        trainingParticipant: {
          id: trainingInfo?.id,
          status: trainingInfo?.status || "unknown",
          participant: {
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
          },
          training: {
            id: trainingInfo?.training?.id,
            trainingName: trainingInfo?.training?.trainingName,
          },
        },
      };
    });

    return res.status(200).send(
      successResponse(
        "Certificates for training retrieved successfully",
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


export const updateCertificate = async (req: Request, res: Response) => {
    const updateSchema = (input: any) =>
        Joi.object({
            imageUrl: Joi.string().uri().optional(),
            noLiscense: Joi.string().optional(),
            expiredAt: Joi.date().optional(),
        }).validate(input);

    try {
        const { certificateId } = req.params;
        const body = req.body;

        const idAsNumber = parseInt(certificateId, 10);

        if (isNaN(idAsNumber)) {
            return res.status(400).json({ msg: "Invalid certificate ID format." });
        }

        const { error } = updateSchema(body);
        if (error) {
            return res.status(422).send(validationResponse({ error }));
        }

        const certificate = await certificateRepository.findOneBy({ id: idAsNumber });

        if (!certificate) {
            return res.status(404).json({ msg: "Certificate not found." });
        }

        // Update field yang diberikan saja
        certificate.imageUrl = body.imageUrl ?? certificate.imageUrl;
        certificate.noLiscense = body.noLiscense ?? certificate.noLiscense;
        certificate.expiredAt = body.expiredAt ?? certificate.expiredAt;

        await certificateRepository.save(certificate);

        return res.status(200).send(
            successResponse("Certificate updated successfully", certificate, 200)
        );

    } catch (error: any) {
        return res.status(500).json({ message: error.message });
    }
};

