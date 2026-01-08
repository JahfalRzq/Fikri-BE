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

// Generate a compact, human-friendly license string:
// Format: EXP-<TRAIN>-<PART8>-<YYYYMMDDHHMMSS>-<RAND6>
const makeShort = (s: any) => String(s)
  .replace(/[^a-zA-Z0-9]/g, "")
  .slice(0, 8)
  .toUpperCase();

// Helper: generate certificate image for a trainingParticipant
async function generateCertificateImageHelper(template: any, tp: any, trainingId: any) {
  const canvasWidth = 1200;
  const canvasHeight = 800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  // Resolve template filename and template id
  let templateIdRaw: any = template;
  let templateName = "1.png";
  if (typeof template === "number" || (!isNaN(Number(template)) && String(template).trim() !== "")) {
    templateIdRaw = Number(template);
    templateName = `${templateIdRaw}.png`;
  } else if (typeof template === "string" && template.trim()) {
    templateName = template.trim();
    if (!templateName.toLowerCase().endsWith(".png")) templateName += ".png";
    const maybeNum = parseInt(templateName.replace(/\.png$/i, ""), 10);
    if (!isNaN(maybeNum)) templateIdRaw = maybeNum;
  }

  // Fill background or draw template
  const templatePath = path.join(process.cwd(), "public", "templates", templateName);
  try {
    const exists = fs.existsSync(templatePath);
    if (exists) {
      try {
        const img = await loadImage(templatePath);
        if (img) {
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
      } catch (e) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
    } else {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  } catch (e) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  // Infer chosen logo from template id or pick default
  let chosenLogo = `logo-1.png`;
  if (templateIdRaw && !isNaN(Number(templateIdRaw))) {
    chosenLogo = `logo-${Number(templateIdRaw)}.png`;
  }

  // Overlay (watermark)
  const overlayCandidates = [
    path.join(process.cwd(), "public", "logo", chosenLogo),
    path.join(process.cwd(), "public", "logos", chosenLogo),
    path.join(process.cwd(), "public", "templates", chosenLogo),
    path.join(process.cwd(), "public", chosenLogo),
  ];
  for (const cand of overlayCandidates) {
    try {
      if (fs.existsSync(cand)) {
        try {
          const imgO = await loadImage(cand);
          if (imgO) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            const targetW = Math.round(canvasWidth * 0.9);
            const scale = targetW / imgO.width || 1;
            const w = Math.round(imgO.width * scale);
            const h = Math.round(imgO.height * scale);
            const x = Math.round((canvasWidth - w) / 2);
            const y = Math.round((canvasHeight - h) / 2);
            ctx.drawImage(imgO, x, y, w, h);
            ctx.restore();
            break;
          }
        } catch (e) {
          // continue
        }
      }
    } catch (e) {
      // continue
    }
  }

  // Top logo
  const topLogoCandidates = [
    path.join(process.cwd(), "public", "logo", chosenLogo),
    path.join(process.cwd(), "public", "logos", chosenLogo),
    path.join(process.cwd(), "public", chosenLogo),
  ];
  for (const cand of topLogoCandidates) {
    try {
      if (fs.existsSync(cand)) {
        try {
          const img = await loadImage(cand);
          if (img) {
            const maxWidth = 200;
            const scale = Math.min(1, maxWidth / img.width || 1);
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const x = Math.round((canvasWidth - w) / 2);
            const y = 40;
            ctx.drawImage(img, x, y, w, h);
            break;
          }
        } catch (e) {
          // continue
        }
      }
    } catch (e) {
      // continue
    }
  }

  // Certificate content (centered)
  const now = new Date();
  const topMargin = 40;
  ctx.fillStyle = "#1b263b";
  ctx.textAlign = "center";
  ctx.font = 'bold 72px "Playfair Display", serif';
  ctx.fillText("CERTIFICATE", canvasWidth / 2, 210 + 0);

  const tplCheck = String(template || "").trim();
  if (tplCheck !== "1" && tplCheck.toLowerCase() !== "1.png") {
    ctx.font = '18px "Montserrat", sans-serif';
    ctx.fillStyle = "#333";
    ctx.fillText("PT ELTASA PRIMA KONSULTA", canvasWidth / 2, 250);
  }

  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("1687/EXP/14/XI/2025", canvasWidth / 2, 235 + topMargin);

  ctx.font = '24px "Montserrat", sans-serif';
  ctx.fillText("This is to certify that", canvasWidth / 2, 300 + topMargin);

  const recipient = `${tp.participant.firstName || ""} ${tp.participant.lastName || ""}`.trim();
  ctx.font = 'italic bold 44px "Playfair Display", serif';
  ctx.fillStyle = "#000";
  ctx.fillText(recipient || "-", canvasWidth / 2, 360 + topMargin);

  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Departemen Teknologi Industri Pertanian, Universitas Gadjah Mada", canvasWidth / 2, 390 + topMargin);

  ctx.font = '24px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Has Successfully Completed Training Course on:", canvasWidth / 2, 460 + topMargin);

  const course = tp.training?.trainingName || "Data Analyst";
  ctx.font = 'bold 36px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText(course, canvasWidth / 2, 510 + topMargin);

  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  ctx.fillText("Held on November 27th until November 28th, 2025 in Yogyakarta", canvasWidth / 2, 550 + topMargin);

  // Signatory area
  const signY = 600 + topMargin;
  ctx.font = '20px "Montserrat", sans-serif';
  ctx.fillStyle = "#000";
  const signatory = tp.signatoryName || "Prof. Dr. Ir. Elisa Kusrini, MT, CPIM, CSCP";
  ctx.textAlign = "center";
  const signX = canvasWidth / 2;
  ctx.fillText(signatory, signX, signY);

  // Try to draw signature image ttd-<id>
  let ttdFile = "ttd-1.png";
  try {
    const tpl = String(template || "").trim();
    const tplNumStr = tpl.replace(/\.png$/i, "");
    const tplNum = parseInt(tplNumStr, 10);
    if (!isNaN(tplNum) && tplNum > 0) {
      ttdFile = `ttd-${tplNum}.png`;
    }
  } catch (e) {
    // ignore
  }

  const ttdCandidates = [
    path.join(process.cwd(), "public", "ttds", ttdFile),
    path.join(process.cwd(), "public", "ttd", ttdFile),
    path.join(process.cwd(), "public", "signatures", ttdFile),
  ];
  let ttdDrawn = false;
  for (const cand of ttdCandidates) {
    try {
      if (fs.existsSync(cand)) {
        try {
          const imgT = await loadImage(cand);
          if (imgT) {
            const maxW = 180;
            const scale = Math.min(1, maxW / imgT.width || 1);
            const w = Math.round(imgT.width * scale);
            const h = Math.round(imgT.height * scale);
            const x = signX - Math.round(w / 2);
            const y = signY - Math.round(h / 2) + 70;
            ctx.drawImage(imgT, x, y, w, h);
            ttdDrawn = true;
            break;
          }
        } catch (e) {
          // continue
        }
      }
    } catch (e) {
      // continue
    }
  }
  if (!ttdDrawn) {
    // placeholder signature line
    const sigWidth = 220;
    ctx.beginPath();
    ctx.moveTo(signX - sigWidth / 2, signY + 10);
    ctx.lineTo(signX + sigWidth / 2, signY + 10);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Organization and director
  ctx.font = '600 18px "Montserrat", sans-serif';
  ctx.textAlign = "center";
  const org = tp.organization || "SCOR-P";
  const orgY = signY + 70;
  ctx.fillText(org, canvasWidth / 2, orgY);
  const orgW = ctx.measureText(org).width;
  ctx.beginPath();
  ctx.moveTo(canvasWidth / 2 - orgW / 2, orgY + 4);
  ctx.lineTo(canvasWidth / 2 + orgW / 2, orgY + 4);
  ctx.stroke();

  ctx.font = '18px "Montserrat", sans-serif';
  ctx.fillText("Director", canvasWidth / 2, orgY + 30);

  // Save output
  const outDir = path.join(process.cwd(), "public", "certificates");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const pad = (n: number) => n.toString().padStart(2, "0");
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const noLicense = `EXP-${makeShort(trainingId)}-${makeShort(tp.participant.id)}-${ts}-${rand}`;
  const filename = `${noLicense}.png`;
  const outPath = path.join(outDir, filename);
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);

  return {
    noLicense,
    filename,
    imageUrl: `/certificates/${filename}`,
    expiredAt: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
  };
}


export const publishCertificates = async (req: Request, res: Response) => {
const publishSchema = Joi.object({
  trainingId: Joi.string().uuid().required(),
  trainingParticipantIds: Joi.array()
    .items(Joi.string().uuid())
    .min(1)
    .required(),
  template: Joi.number().optional().default(1),
});

 try {
    const { error, value } = publishSchema.validate(req.body);
    if (error) {
      return res
        .status(400)
        .send(validationResponse(error.details[0].message));
    }

    const { trainingId, trainingParticipantIds, template } = value;

    const trainingParticipants = await trainingParticipantRepository.find({
      where: {
        training: { id: trainingId },
      },
      relations: ["participant", "training", "certificate"],
    });

    if (!trainingParticipants.length) {
      return res
        .status(404)
        .send(errorResponse("Training participants not found", 404));
    }

    const updated: any[] = [];
    const skipped: string[] = [];

    for (const tpId of trainingParticipantIds) {
      const tp = trainingParticipants.find((tp) => tp.id === tpId);

      if (!tp) {
        skipped.push(`${tpId} (not in this training)`);
        continue;
      }

      let cert = tp.certificate;
      if (!cert) {
        cert = certificateRepository.create();
      }

      const gen = await generateCertificateImageHelper(
        template,
        tp,
        trainingId
      );

      cert.noLiscense = gen.noLicense;
      cert.imageUrl = gen.imageUrl;
      cert.expiredAt = gen.expiredAt;
      cert.trainingParticipant = tp;

      const savedCert = await certificateRepository.save(cert);
      tp.certificate = savedCert;
      await trainingParticipantRepository.save(tp);

      updated.push({
        trainingParticipantId: tp.id,
        certificateId: savedCert.id,
        noLiscense: savedCert.noLiscense,
        imageUrl: savedCert.imageUrl,
      });
    }

    return res.status(200).send(
      successResponse(
        "Certificates published successfully",
        {
          updatedCount: updated.length,
          certificates: updated,
          skipped,
        },
        200
      )
    );
  } catch (err: any) {
    console.error(err);
    return res.status(500).send(errorResponse(err.message, 500));
  }
};






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

































