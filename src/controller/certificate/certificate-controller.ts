import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { certificate } from "@/model/certificate";
import { successResponse, errorResponse,validationResponse } from "@/utils/response"; // Assuming you have errorResponse
import { statusTraining } from "@/model/training-participant"; // Import the enum
import Joi from "joi";
import { trainingParticipant } from "@/model/training-participant";
import { participant } from "@/model/participant"; // ✅ Kita akan mulai dari sini
import { createCanvas, loadImage } from "canvas";
import path from "path";
import fs from "fs";


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


export const publishCertificates = async (req: Request, res: Response) => {
  try {
    const { participantIds, trainingId } = req.body;
    if (!trainingId || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).send(errorResponse("Invalid request body", 400));
    }

    // Ambil semua participant dari training terkait beserta sertifikatnya
    const trainingParticipants = await trainingParticipantRepository.find({
      where: { training: { id: trainingId } },
      relations: ["participant", "certificate"],
    });

    if (!trainingParticipants.length) {
      return res.status(404).send(errorResponse("No participants found for this training", 404));
    }

    const updatedCertificates: any[] = [];
    const skipped: string[] = [];

    for (const participantId of participantIds) {
      const tp = trainingParticipants.find(tp => tp.participant.id === participantId);
      if (!tp) {
        skipped.push(participantId + " (not found in this training)");
        continue;
      }

      // ✅ Hanya peserta dengan status 'selesai' yang boleh diperbarui sertifikatnya
      if (tp.status !== statusTraining.selesai) {
        skipped.push(`${participantId} (status: ${tp.status})`);
        continue;
      }

      if (!tp.certificate) {
        skipped.push(`${participantId} (certificate does not exist)`);
        continue;
      }

      // Validasi createdAt dan updatedAt
      if (tp.certificate.createdAt.getTime() !== tp.certificate.updatedAt.getTime()) {
        skipped.push(`${participantId} (certificate already published)`);
        continue;
      }

      // Generate certificate image dan save to public/certificates/<noLiscense>.png
      try {
        const canvasWidth = 1200;
        const canvasHeight = 800;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Load a template background if available
        const templatePath = path.join(process.cwd(), "public", "templates", "template1.png");
        if (fs.existsSync(templatePath)) {
          const img = await loadImage(templatePath);
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        } else {
          // fallback: fill white background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        // Draw participant name
        const name = `${tp.participant.firstName || ""} ${tp.participant.lastName || ""}`.trim();
        ctx.fillStyle = "#000";
        ctx.textAlign = "center";

        // Title/name style (uses registered Playfair Display if available)
        ctx.font = '48px "Playfair Display"';
        ctx.fillText(name || "-", canvasWidth / 2, canvasHeight / 2 - 20);

        // Draw training info (small)
        const trainingName = tp.training?.trainingName || `Training ${trainingId}`;
        ctx.font = '20px "Montserrat"';
        ctx.fillText(trainingName, canvasWidth / 2, canvasHeight / 2 + 30);

        // Ensure output directory
        const outDir = path.join(process.cwd(), "public", "certificates");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        const noLicense = `EXPIND-${trainingId}-${tp.participant.id}-${Date.now()}`;
        const filename = `${noLicense}.png`;
        const outPath = path.join(outDir, filename);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outPath, buffer);

        // Update certificate with noLicense and imageUrl
        tp.certificate.noLiscense = noLicense;
        tp.certificate.imageUrl = `/certificates/${filename}`;
        tp.certificate.expiredAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 year from now

        const saved = await certificateRepository.save(tp.certificate);
        updatedCertificates.push(saved);
      } catch (genErr: any) {
        // If image generation fails for this participant, skip and record reason
        skipped.push(`${participantId} (image generation failed: ${genErr?.message || genErr})`);
        continue;
      }
    }

    if (updatedCertificates.length === 0) {
      return res.status(200).send(
        successResponse("No certificates updated", {
          skipped,
          updatedCount: 0,
        }, 200)
      );
    }

    return res.status(200).send(
      successResponse(
        "Certificates updated successfully",
        {
          updatedCount: updatedCertificates.length,
          updatedCertificates: updatedCertificates.map(c => ({
            id: c.id,
            noLiscense: c.noLiscense,
            expiredAt: c.expiredAt,
            imageUrl: c.imageUrl,
            trainingParticipantId: c.trainingParticipant?.id,
          })),
          skipped,
        },
        200
      )
    );
  } catch (error: any) {
    console.error("Error updating certificates:", error);
    return res.status(500).send(errorResponse(error.message, 500));
  }
};


