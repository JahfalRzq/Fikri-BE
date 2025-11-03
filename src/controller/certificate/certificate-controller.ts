import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { certificate } from "@/model/certificate";
import { successResponse, errorResponse, validationResponse } from "@/utils/response"; // Assuming you have errorResponse
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


export const getCertificateByNoLicense = async (req: Request, res: Response) => {
  try {
    const { noLicense } = req.params;
    if (!noLicense || typeof noLicense !== "string") {
      return res.status(400).send(errorResponse("Invalid or missing certificate noLicense", 400));
    }

    // Cari sertifikat berdasarkan noLicense dengan relasi yang diperlukan
    const certificate = await certificateRepository.findOne({
      where: { noLiscense: noLicense },
      relations: [
        "trainingParticipant",
        "trainingParticipant.participant", // participant
        "trainingParticipant.training",    // training
        "trainingParticipant.coach",       // coach
        "trainingParticipant.trainingParticipantCategory", // join table
        "trainingParticipant.trainingParticipantCategory.category", // category melalui join table
      ],
    });

    if (!certificate) {
      return res.status(404).send(errorResponse("Certificate not found", 404));
    }

    // Ambil data trainingParticipant
    const tp = certificate.trainingParticipant;

    // Ambil category dari join table jika ada
    const category = tp?.trainingParticipantCategory?.category || null;

    // Bentuk response yang lebih lengkap
    const responseData = {
      id: certificate.id,
      noLiscense: certificate.noLiscense,
      imageUrl: certificate.imageUrl,
      expiredAt: certificate.expiredAt,
      createdAt: certificate.createdAt,
      updatedAt: certificate.updatedAt, // Tambahkan ini
      trainingParticipant: tp
        ? {
            id: tp.id,
            status: tp.status,
            // Tambahkan field dari trainingParticipant
            startDateTraining: tp.startDateTraining,
            endDateTraining: tp.endDateTraining,
            ttdImage: tp.ttdImage,
            signatoryName: tp.signatoryName,
            signatoryPosition: tp.signatoryPosition,
            participant: {
              id: tp.participant?.id,
              firstName: tp.participant?.firstName,
              lastName: tp.participant?.lastName,
              email: tp.participant?.email,
              // Tambahkan field dari participant
              company: tp.participant?.company,
              jobTitle: tp.participant?.jobTitle,
              // tambahkan field lain dari participant jika diperlukan
            },
            training: {
              id: tp.training?.id,
              trainingName: tp.training?.trainingName,
              // tambahkan field lain dari training jika diperlukan
            },
            coach: tp.coach // Kembalikan data coach secara lengkap
              ? {
                  id: tp.coach.id,
                  coachName: tp.coach.coachName,
                  // tambahkan field lain dari coach jika diperlukan
                }
              : null,
            category: category // Kembalikan data category dari join table
              ? {
                  id: category.id,
                  categoryName: category.categoryName,
                  trainingCode: category.trainingCode,
                  // tambahkan field lain dari category jika diperlukan
                }
              : null,
          }
        : null,
    };

    return res.status(200).send(
      successResponse("Certificate retrieved successfully", responseData, 200)
    );
  } catch (error: any) {
    console.error("Error retrieving certificate:", error);
    return res.status(500).send(errorResponse(error.message, 500));
  }
};



export const publishCertificates = async (req: Request, res: Response) => {
  try {
    const { participantIds, trainingId, template } = req.body;
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

      // if (tp.status !== statusTraining.selesai) {
      //   skipped.push(`${participantId} (status: ${tp.status})`);
      //   continue;
      // }

      // Determine certificate entity: create if missing, otherwise validate publish state
      let cert = tp.certificate as any;
      let isNewCert = false;
      if (!cert) {
        // create a new certificate entity (not yet saved)
        cert = certificateRepository.create();
        isNewCert = true;
      } else {
        // If certificate exists and was already published (updatedAt differs), skip
        // if (cert.createdAt && cert.updatedAt && cert.createdAt.getTime() !== cert.updatedAt.getTime()) {
        //   skipped.push(`${participantId} (certificate already published)`);
        //   continue;
        // }
      }

      // Generate certificate image dan save to public/certificates/<noLiscense>.png
      try {
        const canvasWidth = 1200;
        const canvasHeight = 800;
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const ctx = canvas.getContext("2d");

        // Resolve template filename. Accept numeric ids (1 -> "1.png"), plain names or full filenames.
        let templateName = "1.png"; // default template path is public/templates/1.png
        if (typeof template === "number" || (!isNaN(Number(template)) && String(template).trim() !== "")) {
          templateName = `${template}.png`;
        } else if (typeof template === "string" && template.trim()) {
          templateName = template.trim();
          if (!templateName.toLowerCase().endsWith(".png")) templateName += ".png";
        }
        const templatePath = path.join(process.cwd(), "public", "templates", templateName);
        try {
          const exists = fs.existsSync(String(templatePath));
          console.info(`Template path: ${templatePath} (exists: ${exists})`);
          if (exists) {
            try {
              const img = await loadImage(String(templatePath));
              if (img) {
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                console.info(`Template image drawn for participant ${participantId}`);
              } else {
                console.warn(`loadImage returned falsy for ${templatePath}`);
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
              }
            } catch (imgErr) {
              console.warn(`Failed to load template image ${templatePath}:`, imgErr);
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            }
          } else {
            // fallback: fill white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          }
        } catch (existsErr) {
          // defensive: if fs.existsSync throws because of wrong type, fallback to white
          console.warn(`Template existence check failed for ${templatePath}:`, existsErr);
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
        ctx.fillText(trainingName, canvasWidth / 2, canvasHeight / 2 + 40);

        // Ensure output directory
        const outDir = path.join(process.cwd(), "public", "certificates");
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        const pad = (n: number) => n.toString().padStart(2, "0");
        const now = new Date();
        const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
        const noLicense = `EXP-${makeShort(trainingId)}-${makeShort(tp.participant.id)}-${ts}-${rand}`;
        const filename = `${noLicense}.png`;
        const outPath = path.join(outDir, filename);
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outPath, buffer);

        // Update certificate fields
        cert.noLiscense = noLicense;
        cert.imageUrl = `/certificates/${filename}`;
        cert.expiredAt = new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000); // 3 year from now

        // Link certificate to trainingParticipant before saving (entity relationship)
        try {
          (cert as any).trainingParticipant = tp;
        } catch (e) {
          // ignore if relationship doesn't exist on entity shape
        }

        const saved = await certificateRepository.save(cert);
        // attach to tp for later mapping and persist the relationship on the trainingParticipant side
        try {
          (tp as any).certificate = saved;
          await trainingParticipantRepository.save(tp);
        } catch (relErr) {
          // non-fatal: log but continue — certificate itself was saved
          console.warn(`Failed to link certificate to trainingParticipant ${tp.id}:`, relErr);
        }

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






// Generate a compact, human-friendly license string:
// Format: EXP-<TRAIN>-<PART8>-<YYYYMMDDHHMMSS>-<RAND6>
const makeShort = (s: any) => String(s)
  .replace(/[^a-zA-Z0-9]/g, "")
  .slice(0, 8)
  .toUpperCase();