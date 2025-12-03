import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { user, UserRole } from "@/model/user";
import Joi from "joi";
import { training } from "@/model/training";
import { participant } from "@/model/participant";
import { trainingParticipantCategory } from "@/model/training-participant-category";
import {
  successResponse,
  validationResponse,
  errorResponse
} from "@/utils/response";
import { trainingParticipant, statusTraining } from "@/model/training-participant";
import { certificate } from "@/model/certificate";
import * as xlsx from "xlsx";
import { In } from "typeorm";


const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);
const trainingParticipantRepository = AppDataSource.getRepository(trainingParticipant)
const trainingParticipantCategoryRepository = AppDataSource.getRepository(trainingParticipantCategory);
const certificateRepository = AppDataSource.getRepository(certificate)

export const getParticipantsByTrainingId = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const status = (req.query.status as string) || "";
    const skip = (page - 1) * limit;

    // ✅ SELECT kolom penting saja
    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.certificate", "certificate")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category").orderBy("participant.createdAt", "DESC");

    // ✅ Filter trainingId
    if (trainingId) {
      queryBuilder.andWhere("training.id = :trainingId", { trainingId });
    }

    // ✅ Filter status (optional)
    if (status && Object.values(statusTraining).includes(status as statusTraining)) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // ✅ Search ringan
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search
          OR participant.lastName LIKE :search
          OR participant.email LIKE :search
          OR user.userName LIKE :search
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // ✅ Pagination
    queryBuilder.skip(skip).take(limit);

    // Jalankan query & count terpisah
    const [participants, totalCount] = await Promise.all([
      queryBuilder.getMany(),
      participantRepository
        .createQueryBuilder("participant")
        .leftJoin("participant.trainingParticipant", "tp")
        .leftJoin("tp.training", "training")
        .where("training.id = :trainingId", { trainingId })
        .andWhere("participant.deletedAt IS NULL")
        .getCount(),
    ]);

    // ✅ Transform hasil untuk FE
    const safeData = participants.map((p) => {
      const trainingParticipant = p.trainingParticipant.find((tp: any) => tp.training?.id === trainingId);

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.jobTitle,
        phone: p.phone,
        user: p.user
          ? {
            id: p.user.id,
            userName: p.user.userName,
          }
          : null,
        status: trainingParticipant?.status ?? "unknown",
        certificate: trainingParticipant?.certificate ?? null,
      };
    });

    return res.status(200).send(
      successResponse(
        "Get Participants by Training ID Success (Optimized & Fixed)",
        {
          data: safeData,
          totalCount,
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error: any) {
    console.error(error);
    return res.status(500).send(errorResponse(error.message, 500));
  }
};


export const getArchivedParticipantsByTrainingId = async (req: Request, res: Response) => {
  try {
    // Ambil 'id' training dari params, sama seperti di fungsi referensi Anda
    const trainingId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    // Filter status mungkin tidak relevan untuk yang diarsip, tapi bisa ditambahkan jika perlu
    const skip = (page - 1) * limit;

    // ✅ DIUBAH: Query Builder dimulai dari 'trainingParticipant' (tp)
    // Ini adalah perubahan KUNCI karena 'tp' yang di-soft delete
    const queryBuilder = trainingParticipantRepository
      .createQueryBuilder("tp")
      .withDeleted() // PENTING: Untuk bisa menemukan data yang di-soft delete
      .leftJoinAndSelect("tp.participant", "participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .orderBy("tp.deletedAt", "DESC"); // Urutkan berdasarkan data yang baru diarsip

    // ✅ Filter hanya peserta dalam training tertentu
    if (trainingId) {
      queryBuilder.andWhere("training.id = :trainingId", { trainingId });
    }

    // ✅ KUNCI UTAMA: Filter HANYA yang sudah di-soft delete (diarsip)
    queryBuilder.andWhere("tp.deletedAt IS NOT NULL");

    // ✅ Search multi-field (logika sama persis)
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search
          OR participant.lastName LIKE :search
          OR participant.email LIKE :search
          OR user.userName LIKE :search
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // ✅ Pagination
    queryBuilder.skip(skip).take(limit);

    // Hasilnya adalah array dari 'trainingParticipant'
    const [trainingParticipants, totalCount] = await queryBuilder.getManyAndCount();

    // ✅ Transform hasil (format sama persis dengan 'safeData' Anda)
    const safeData = trainingParticipants.map((tp) => {
      // 'tp' adalah 'trainingInfo' dari fungsi referensi Anda
      const p = tp.participant; // 'p' adalah partisipannya
      if (!p) return null; // Keamanan jika ada data yatim

      // Ekstrak kategori (logika sama persis)
      const categoriesArray = tp.training?.trainingCategory?.map((tc: any) => tc.category) || [];
      const firstCategory = categoriesArray.length > 0 ? categoriesArray[0] : null;

      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        company: p.company,
        jobTitle: p.jobTitle,
        phone: p.phone,
        message: p.message,
        createdAt: p.createdAt,
        user: p.user
          ? {
            id: p.user.id,
            userName: p.user.userName,
            role: p.user.role,
            image: p.user.imageAvatar,
          }
          : null,
        status: tp.status ?? "Archived", // Tampilkan status dari 'tp' atau "Archived"
        deletedAt: tp.deletedAt, // Sertakan info kapan dihapus
        training: tp.training
          ? {
            id: tp.training.id,
            trainingName: tp.training.trainingName,
            startDateTraining: tp.training.startDateTraining,
            endDateTraining: tp.training.endDateTraining,
            category: firstCategory,
          }
          : null,
      };
    }).filter(Boolean); // Hapus data null jika ada

    return res.status(200).send(
      successResponse(
        "Get Archived Participants by Training ID Success", // Pesan diubah
        {
          data: safeData,
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


export const getAllParticipant = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      company,
      trainingCode,
      startDateTraining,
      endDateTraining,
      search,
      status, // filter status trainingParticipant
      limit: queryLimit,
      page,
    } = req.query;

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateTraining) {
      startDate = new Date(startDateTraining as string);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid startDateTraining format. Expected YYYY-MM-DD.",
        });
      }
    }

    if (endDateTraining) {
      endDate = new Date(endDateTraining as string);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid endDateTraining format. Expected YYYY-MM-DD.",
        });
      }
    }

    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .orderBy("participant.createdAt", "DESC");

    // 🔍 Filter nama depan
    if (firstName) {
      queryBuilder.andWhere("participant.firstName LIKE :firstName", {
        firstName: `%${firstName}%`,
      });
    }

    // 🔍 Filter perusahaan
    if (company) {
      queryBuilder.andWhere("participant.company LIKE :company", {
        company: `%${company}%`,
      });
    }

    // 🔍 Filter kode pelatihan
    if (trainingCode) {
      queryBuilder.andWhere("category.trainingCode LIKE :trainingCode", {
        trainingCode: `%${trainingCode}%`,
      });
    }

    // 🔍 Search multi-field
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search 
          OR participant.lastName LIKE :search 
          OR participant.email LIKE :search 
          OR user.userName LIKE :search 
          OR user.email LIKE :search)`,
        { search: `%${search}%` }
      );
    }

    // 🔍 Filter status pelatihan
    if (status) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // 🔍 Filter rentang tanggal
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        { startDate, endDate }
      );
    }

    // 🔢 Pagination
    const dynamicLimit = queryLimit ? parseInt(queryLimit as string, 10) : 10;
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * dynamicLimit;

    const [participants, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit)
      .getManyAndCount();

    // 🧠 Transformasi data
    const safeData = participants.map((p) => ({
      id: p.id,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.email,
      company: p.company,
      companyAddress: p.companyAddress,
      jobTitle: p.jobTitle,
      phone: p.phone,
      officePhone: p.officePhone,
      message: p.message,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,

      user: p.user
        ? {
          id: p.user.id,
          userName: p.user.userName,
          role: p.user.role,
          image: p.user.imageAvatar,
        }
        : null,

      trainingParticipant: Array.isArray(p.trainingParticipant)
        ? p.trainingParticipant.map((tp) => ({
          id: tp.id,
          status: tp.status,
          training: tp.training
            ? {
              id: tp.training.id,
              trainingName: tp.training.trainingName,
              price: tp.training.price,
              startDateTraining: tp.training.startDateTraining,
              endDateTraining: tp.training.endDateTraining,
              category:
                tp.training.trainingCategory &&
                  tp.training.trainingCategory.length > 0
                  ? tp.training.trainingCategory.map((tc) => ({
                    id: tc.id,
                    name: tc.category?.categoryName,
                    code: tc.category?.trainingCode,
                  }))
                  : [],
            }
            : null,
        }))
        : [],
    }));

    return res.status(200).send(
      successResponse(
        "Get Participant Success",
        {
          data: safeData,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / dynamicLimit),
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participantRecord = await participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .where("participant.id = :id", { id })
      .getOne();

    if (!participantRecord) {
      return res.status(404).json({ msg: "Participant not found" });
    }

    // 🧠 Transformasi hasil agar rapi & siap pakai di FE
    const participantDetail = {
      id: participantRecord.id,
      firstName: participantRecord.firstName,
      lastName: participantRecord.lastName,
      email: participantRecord.email,
      company: participantRecord.company,
      companyAddress: participantRecord.companyAddress,
      phone: participantRecord.phone,
      officePhone: participantRecord.officePhone,
      jobTitle: participantRecord.jobTitle,
      message: participantRecord.message,
      createdAt: participantRecord.createdAt,
      updatedAt: participantRecord.updatedAt,

      user: participantRecord.user
        ? {
          id: participantRecord.user.id,
          userName: participantRecord.user.userName,
          role: participantRecord.user.role,
          image: participantRecord.user.imageAvatar,
        }
        : null,

      trainings:
        Array.isArray(participantRecord.trainingParticipant) &&
          participantRecord.trainingParticipant.length > 0
          ? participantRecord.trainingParticipant.map((tp) => ({
            trainingParticipantId: tp.id,
            status: tp.status,
            training: tp.training
              ? {
                id: tp.training.id,
                trainingName: tp.training.trainingName,
                price: tp.training.price,
                startDateTraining: tp.training.startDateTraining,
                endDateTraining: tp.training.endDateTraining,
                createdAt: tp.training.createdAt,
                updatedAt: tp.training.updatedAt,
                category:
                  tp.training.trainingCategory &&
                    tp.training.trainingCategory.length > 0
                    ? tp.training.trainingCategory.map((tc) => ({
                      id: tc.id,
                      name: tc.category?.categoryName,
                      code: tc.category?.trainingCode,
                    }))
                    : [],
              }
              : null,
          }))
          : [],
    };

    return res.status(200).send(
      successResponse(
        "Get Participant by ID Success",
        { data: participantDetail },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const createParticipant = async (req: Request, res: Response) => {
  // Skema validasi yang fleksibel untuk menangani kedua kasus
  const createParticipantSchema = (input: any) =>
    Joi.object({
      training: Joi.string().required(),
      participants: Joi.array().items(
        Joi.object({
          // Flag wajib untuk membedakan alur
          isExisting: Joi.boolean().required(),

          // Wajib jika isExisting: true
          participantId: Joi.string().when('isExisting', { is: true, then: Joi.required() }),

          // Wajib jika isExisting: false
          email: Joi.string().email().when('isExisting', { is: false, then: Joi.required() }),
          firstName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          lastName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          user: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          signatoryName: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          signatoryPosition: Joi.string().when('isExisting', { is: false, then: Joi.required() }),
          ttdImage: Joi.string().allow("").when('isExisting', { is: false, then: Joi.required() }),

          // Field opsional untuk isExisting: false
          company: Joi.string().optional(),
          companyAddress: Joi.string().optional(),
          phone: Joi.string().optional(),
          jobTitle: Joi.string().optional(),
          officePhone: Joi.string().optional(),
          message: Joi.string().optional(),
        })
      ).min(1).required(),
    }).validate(input);

  try {
    const body = req.body;
    const { error } = createParticipantSchema(body);
    if (error) {
      return res.status(422).send(validationResponse({ error }));
    }

    // Ambil data training satu kali di luar loop
    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
      relations: ["trainingCategory", "trainingCategory.category", "trainingCoach"],
    });

    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    if (!trainingRec.trainingCoach) {
      return res.status(400).json({
        msg: "Training coach is missing — please assign a coach before adding participants.",
      });
    }

    const successfulCreations: any[] = [];
    const failedCreations: any[] = [];

    // Lakukan loop untuk setiap peserta dalam array
    for (const participantData of body.participants) {
      try {
        // --- CASE 1: EXISTING PARTICIPANT ---
        if (participantData.isExisting) {
          const selectedParticipant = await participantRepository.findOne({
            where: { id: participantData.participantId },
            relations: ["user"],
          });

          if (!selectedParticipant) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Participant Not Found" });
            continue;
          }

          if (!selectedParticipant.user) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Associated user not found for this participant" });
            continue;
          }

          const existingRel = await trainingParticipantRepository.findOne({
            where: {
              training: { id: trainingRec.id },
              participant: { id: selectedParticipant.id },
            },
          });

          if (existingRel) {
            failedCreations.push({ participantId: participantData.participantId, reason: "Participant already registered in this training" });
            continue;
          }

          // Proses pembuatan relasi baru
          const newTP = new trainingParticipant();
          newTP.training = trainingRec;
          newTP.participant = selectedParticipant;
          newTP.status = statusTraining.belumMulai;
          newTP.coach = trainingRec.trainingCoach;
          newTP.startDateTraining = trainingRec.startDateTraining;
          newTP.endDateTraining = trainingRec.endDateTraining;

          // Berikan nilai default untuk signatory
          newTP.signatoryName = `${selectedParticipant.firstName} ${selectedParticipant.lastName}`;
          newTP.signatoryPosition = "Peserta";
          newTP.ttdImage = ""; // Kosongkan atau isi dengan URL placeholder
          await trainingParticipantRepository.save(newTP);

          // Buat trainingParticipantCategory
          for (const tc of trainingRec.trainingCategory) {
            const newTPC = new trainingParticipantCategory();
            (newTPC as any).trainingParticipant = [newTP];
            (newTPC as any).category = tc.category;
            await trainingParticipantCategoryRepository.save(newTPC);
          }

          // Buat certificate
          const cert = new certificate();
          cert.trainingParticipant = newTP;
          cert.imageUrl = "";
          cert.noLiscense = "";
          cert.expiredAt = new Date();
          await certificateRepository.save(cert);

          // Kaitkan certificate ke trainingParticipant
          newTP.certificate = cert;
          await trainingParticipantRepository.save(newTP);

          successfulCreations.push({
            participantId: selectedParticipant.id,
            name: `${selectedParticipant.firstName} ${selectedParticipant.lastName}`,
            status: "Added as Existing"
          });

        } else {
          // --- CASE 2: NEW PARTICIPANT ---
          const userRecord = await userRepository.findOneBy({ id: participantData.user });
          if (!userRecord) {
            failedCreations.push({ name: participantData.firstName, reason: "User Not Found" });
            continue;
          }

          const newParticipant = new participant();
          newParticipant.email = participantData.email;
          newParticipant.firstName = participantData.firstName;
          newParticipant.lastName = participantData.lastName;
          newParticipant.company = participantData.company;
          newParticipant.companyAddress = participantData.companyAddress;
          newParticipant.phone = participantData.phone;
          newParticipant.jobTitle = participantData.jobTitle;
          newParticipant.officePhone = participantData.officePhone;
          newParticipant.message = participantData.message;
          newParticipant.user = userRecord;
          await participantRepository.save(newParticipant);

          const newTP = new trainingParticipant();
          newTP.training = trainingRec;
          newTP.participant = newParticipant;
          newTP.status = statusTraining.belumMulai;
          newTP.coach = trainingRec.trainingCoach;
          newTP.signatoryName = participantData.signatoryName;
          newTP.signatoryPosition = participantData.signatoryPosition;
          newTP.ttdImage = participantData.ttdImage;
          newTP.startDateTraining = trainingRec.startDateTraining;
          newTP.endDateTraining = trainingRec.endDateTraining;
          await trainingParticipantRepository.save(newTP);

          // Buat trainingParticipantCategory
          for (const tc of trainingRec.trainingCategory) {
            const newTPC = new trainingParticipantCategory();
            (newTPC as any).trainingParticipant = [newTP];
            (newTPC as any).category = tc.category;
            await trainingParticipantCategoryRepository.save(newTPC);
          }

          // Buat certificate
          const cert = new certificate();
          cert.trainingParticipant = newTP;
          cert.imageUrl = "";
          cert.noLiscense = "";
          cert.expiredAt = new Date();
          await certificateRepository.save(cert);

          // Kaitkan certificate ke trainingParticipant
          newTP.certificate = cert;
          await trainingParticipantRepository.save(newTP);

          successfulCreations.push({
            participantId: newParticipant.id,
            name: `${newParticipant.firstName} ${newParticipant.lastName}`,
            status: "Created as New"
          });
        }
      } catch (loopError: any) {
        failedCreations.push({
          participantId: participantData.participantId || 'N/A',
          name: participantData.firstName || 'N/A',
          reason: loopError.message || 'Unknown error during processing'
        });
      }
    }

    // Kirim response berupa rangkuman hasil
    return res.status(201).send(
      successResponse(
        `Process complete. Success: ${successfulCreations.length}, Failed: ${failedCreations.length}`,
        {
          success: successfulCreations,
          failures: failedCreations,
        },
        201
      )
    );

  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Unknown error occurred",
    });
  }
};



export const updateParticipant = async (req: Request, res: Response) => {
  // ✅ Disesuaikan: Skema validasi diperbarui untuk menerima field baru
  const updateParticipantSchema = (input: any) =>
    Joi.object({
      id: Joi.string().required(), // participant id
      training: Joi.string().required(), // training id
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),
      status: Joi.string().valid("belumMulai", "sedangBerlangsung", "selesai", "tidakSelesai").optional(),
      // Field baru ditambahkan sebagai opsional
      signatoryName: Joi.string().optional(),
      signatoryPosition: Joi.string().optional(),
      ttdImage: Joi.string().allow("").optional(),
    }).validate(input);

  try {
    const body = req.body;
    const schema = updateParticipantSchema(body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔹 Ambil participant (tidak ada perubahan)
    const participantRec = await participantRepository.findOne({
      where: { id: body.id },
      relations: ["user"],
    });

    if (!participantRec) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // 🔹 Ambil training (tidak ada perubahan)
    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
    });

    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // 🔹 Update info participant (tidak ada perubahan)
    participantRec.email = body.email ?? participantRec.email;
    participantRec.firstName = body.firstName ?? participantRec.firstName;
    participantRec.lastName = body.lastName ?? participantRec.lastName;
    participantRec.company = body.company ?? participantRec.company;
    participantRec.companyAddress = body.companyAddress ?? participantRec.companyAddress;
    participantRec.phone = body.phone ?? participantRec.phone;
    participantRec.jobTitle = body.jobTitle ?? participantRec.jobTitle;
    participantRec.officePhone = body.officePhone ?? participantRec.officePhone;
    participantRec.message = body.message ?? participantRec.message;

    await participantRepository.save(participantRec);

    // 🔹 Ambil relasi trainingParticipant (tidak ada perubahan)
    const participantTraining = await trainingParticipantRepository.findOne({
      where: {
        training: { id: trainingRec.id },
        participant: { id: participantRec.id },
      },
    });

    // Jika relasi tidak ditemukan, berarti ada data yang tidak konsisten
    if (!participantTraining) {
      return res.status(404).json({ msg: "Participant is not registered in this specific training." });
    }

    // ✅ Disesuaikan: Update status dan informasi penanda tangan di relasi trainingParticipant
    participantTraining.status = body.status ?? participantTraining.status;
    participantTraining.signatoryName = body.signatoryName ?? participantTraining.signatoryName;
    participantTraining.signatoryPosition = body.signatoryPosition ?? participantTraining.signatoryPosition;
    participantTraining.ttdImage = body.ttdImage ?? participantTraining.ttdImage;

    await trainingParticipantRepository.save(participantTraining);


    return res.status(200).send(
      successResponse(
        "Participant updated successfully",
        {
          participant: participantRec,
          participantTraining,
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { trainingId, participantId } = req.params;

    if (!trainingId || !participantId) {
      return res.status(400).json({ msg: "trainingId and participantId are required" });
    }

    // Cek apakah relasi trainingParticipant-nya ada
    const trainingParticipantRec = await trainingParticipantRepository.findOne({
      where: {
        training: { id: trainingId },
        participant: { id: participantId },
      },
      relations: [
        "certificate",
        "trainingParticipantCategory",
        "participant",
        "training",
      ],
      withDeleted: false, // hanya ambil yang belum dihapus
    });

    if (!trainingParticipantRec) {
      return res.status(404).json({ msg: "Participant is not registered in this training" });
    }

    // Soft delete certificate jika ada
    if (trainingParticipantRec.certificate) {
      await certificateRepository.softRemove(trainingParticipantRec.certificate);
    }

    // Soft delete kategori jika ada
    if (trainingParticipantRec.trainingParticipantCategory) {
      await trainingParticipantCategoryRepository.softRemove(
        trainingParticipantRec.trainingParticipantCategory
      );
    }

    // Soft delete relasi utama trainingParticipant
    await trainingParticipantRepository.softRemove(trainingParticipantRec);

    return res.status(200).send(
      successResponse(
        "Participant soft-deleted from this training successfully",
        {
          trainingId,
          participantId,
          deletedAt: new Date().toISOString(),
        },
        200
      )
    );
  } catch (error: any) {
    console.error("Error soft deleting participant:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};




export const changeStatusParticipant = async (req: Request, res: Response) => {
  const changeStatusSchema = (input: any) =>
    Joi.object({
      status: Joi.string()
        .valid(...Object.values(statusTraining))
        .required(),
      trainingId: Joi.string().required(), // training wajib supaya tahu status mana yang diubah
    }).validate(input);

  try {
    const { id } = req.params; // participantId
    const body = req.body;
    const schema = changeStatusSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔍 Cek apakah training ada
    const trainingRecord = await trainingRepository.findOneBy({ id: body.trainingId });
    if (!trainingRecord) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // 🔍 Cek apakah participant terdaftar di training ini
    const participantTraining = await trainingParticipantRepository.findOne({
      where: {
        participant: { id },
        training: { id: body.trainingId },
      },
      relations: ["participant", "training"],
    });

    if (!participantTraining) {
      return res.status(404).json({
        msg: "Participant not registered for this training",
      });
    }

    // ✅ Update status peserta
    participantTraining.status = body.status as statusTraining;
    await trainingParticipantRepository.save(participantTraining);

    return res.status(200).send(
      successResponse(
        "Participant training status updated successfully",
        {
          participantId: id,
          trainingId: body.trainingId,
          newStatus: participantTraining.status,
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const restoreParticipant = async (req: Request, res: Response) => {
  // 1. Gunakan transaksi untuk keamanan data
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 2. Ambil kedua ID dari parameter
    const { trainingId, participantId } = req.params;

    if (!trainingId || !participantId) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ msg: "trainingId and participantId are required" });
    }

    // 3. Cari relasi 'trainingParticipant' yang spesifik, TERMASUK yang sudah di-soft delete
    const trainingParticipantRec = await queryRunner.manager.findOne(trainingParticipant, {
      where: {
        training: { id: trainingId },
        participant: { id: participantId },
      },
      relations: [
        "certificate",
        "trainingParticipantCategory",
      ],
      withDeleted: true, // SANGAT PENTING: untuk menemukan data yang sudah di-soft delete
    });

    if (!trainingParticipantRec) {
      await queryRunner.rollbackTransaction();
      return res.status(404).json({ msg: "Archived participant record not found for this training." });
    }

    if (trainingParticipantRec.deletedAt === null) {
      await queryRunner.rollbackTransaction();
      return res.status(400).json({ msg: "Participant is already active in this training." });
    }

    // 4. Pulihkan (restore) relasi anak terlebih dahulu
    if (trainingParticipantRec.certificate) {
      await queryRunner.manager.restore(certificate, { id: trainingParticipantRec.certificate.id });
    }

    // ✅ DIUBAH: Perlakukan sebagai objek tunggal
    if (trainingParticipantRec.trainingParticipantCategory) {
      // Ambil ID dari objek tunggal tersebut
      const categoryId = trainingParticipantRec.trainingParticipantCategory.id;

      // Restore entri tunggal tersebut
      await queryRunner.manager.restore(trainingParticipantCategory, { id: categoryId });
    }

    // 5. Pulihkan (restore) relasi induk 'trainingParticipant'
    await queryRunner.manager.restore(trainingParticipant, { id: trainingParticipantRec.id });

    // 6. Commit transaksi
    await queryRunner.commitTransaction();

    return res.status(200).send(
      successResponse(
        "Participant restored to this training successfully",
        { restoredRelationId: trainingParticipantRec.id },
        200
      )
    );

  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error("Error restoring participant:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  } finally {
    await queryRunner.release();
  }
};


export const bulkUploadParticipants = async (req: Request, res: Response) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // --- CHECK FILE ---
    if (!req.file) {
      return res.status(400).send(errorResponse("No Excel file uploaded.", 400));
    }

    // --- READ EXCEL ---
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelRows: any[] = xlsx.utils.sheet_to_json(worksheet);

    if (excelRows.length === 0) {
      return res.status(400).send(errorResponse("Excel file is empty.", 400));
    }

    // --- VALIDATE TRAINING ID ---
    const trainingId = req.body.training || req.query.training;
    if (!trainingId) {
      return res.status(422).send(errorResponse("Training ID is required.", 422));
    }

    const trainingRec = await queryRunner.manager.findOne(training, {
      where: { id: trainingId },
      relations: ["trainingCategory", "trainingCategory.category", "trainingCoach"],
    });

    if (!trainingRec) {
      return res.status(404).send(errorResponse("Training not found.", 404));
    }

    if (!trainingRec.trainingCoach) {
      return res.status(400).send(errorResponse("Training coach is missing.", 400));
    }

    // ===============================
    //       VALIDATION PRE-FETCH
    // ===============================

    const validationErrors: string[] = [];

    // Ambil semua ID user dari file Excel untuk pencarian efisien
    // Asumsikan kolom di Excel yang menyimpan ID user adalah 'userId'
    const userIdsInFile = Array.from(
      new Set(
        excelRows
          .filter(r => r.userId) // Filter baris yang userId-nya tidak kosong
          .map(r => r.userId)
      )
    );

    // Ambil data user dari DB dalam satu query
    const users = await queryRunner.manager.findBy(user, { id: In(userIdsInFile) });
    const userMap = new Map(users.map(u => [u.id, u])); // Map untuk pencarian cepat

    // Schema validasi untuk setiap baris di Excel (hanya untuk participant baru, dikaitkan ke user existing)
    const schema = Joi.object({
      // Asumsikan user diidentifikasi oleh 'userId' di file Excel
      userId: Joi.string().required(), // Validasi bahwa userId wajib ada
      email: Joi.string().email().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      signatoryName: Joi.string().required(),
      signatoryPosition: Joi.string().required(),
      ttdImage: Joi.string().allow("").required(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),
    });

    const successfulCreations: any[] = [];
    const failedCreations: any[] = [];

    for (let i = 0; i < excelRows.length; i++) {
      const row = excelRows[i];
      const rowIndex = i + 2; // +2 karena header dianggap row 1

      // Validasi schema
      const { error: validationError } = schema.validate(row);
      if (validationError) {
        failedCreations.push({ rowIndex, reason: `Schema Validation Error: ${validationError.message}` });
        continue;
      }

      // --- PROSES: NEW PARTICIPANT (dikaitkan ke user existing) ---
      // 1. Validasi User Existing
      const u = userMap.get(row.userId);
      if (!u) {
         // Jika user tidak ditemukan di DB berdasarkan ID dari Excel
         failedCreations.push({ rowIndex, userId: row.userId, reason: "User with this ID does not exist in the database." });
         continue; // Lewati baris ini
      }

      // 2. Buat dan simpan Participant Baru yang dikaitkan ke User yang sudah ada
      const newParticipant = new participant();
      newParticipant.email = row.email;
      newParticipant.firstName = row.firstName;
      newParticipant.lastName = row.lastName;
      newParticipant.company = row.company;
      newParticipant.companyAddress = row.companyAddress;
      newParticipant.phone = row.phone;
      newParticipant.jobTitle = row.jobTitle;
      newParticipant.officePhone = row.officePhone;
      newParticipant.message = row.message;
      newParticipant.user = u; // Kaitkan participant ke user yang sudah ada

      const savedParticipant = await queryRunner.manager.save(participant, newParticipant);

      // 3. Buat dan simpan Training Participant
      const newTP = new trainingParticipant();
      newTP.training = trainingRec;
      newTP.participant = savedParticipant;
      newTP.status = statusTraining.belumMulai;
      newTP.coach = trainingRec.trainingCoach;
      newTP.signatoryName = row.signatoryName;
      newTP.signatoryPosition = row.signatoryPosition;
      newTP.ttdImage = row.ttdImage;
      newTP.startDateTraining = trainingRec.startDateTraining;
      newTP.endDateTraining = trainingRec.endDateTraining;

      const savedTP = await queryRunner.manager.save(trainingParticipant, newTP);

      // 4. Buat dan simpan Training Participant Category
      const tpcPromises = trainingRec.trainingCategory.map(async (tc) => {
        const newTPC = new trainingParticipantCategory();
        (newTPC as any).trainingParticipant = [savedTP];
        (newTPC as any).category = tc.category;
        return queryRunner.manager.save(trainingParticipantCategory, newTPC);
      });
      await Promise.all(tpcPromises);

      // 5. Buat dan simpan Certificate
      const cert = new certificate();
      cert.trainingParticipant = savedTP;
      cert.imageUrl = "";
      cert.noLiscense = "";
      cert.expiredAt = new Date();
      const savedCert = await queryRunner.manager.save(certificate, cert);

      // Kaitkan certificate ke trainingParticipant
      savedTP.certificate = savedCert;
      await queryRunner.manager.save(trainingParticipant, savedTP);

      successfulCreations.push({
        rowIndex,
        participantId: savedParticipant.id,
        userId: u.id, // Termasuk ID user yang dikaitkan jika perlu
        name: `${savedParticipant.firstName} ${savedParticipant.lastName}`,
        status: "Created as New Participant linked to existing User"
      });
    }

    // Jika ada kegagalan selama loop (misalnya user tidak ditemukan), transaksi akan di-rollback
    if (failedCreations.length > 0) {
      await queryRunner.rollbackTransaction();
      const totalFailed = failedCreations.length;
      const totalSuccess = successfulCreations.length;
      const errorMessage = `Process completed with errors. Success: ${totalSuccess}, Failed: ${totalFailed}. Details: ${JSON.stringify(failedCreations)}`;
      return res.status(422).send(errorResponse(errorMessage, 422));
    }

    await queryRunner.commitTransaction();

    return res.status(201).send(
      successResponse(
        `${successfulCreations.length} participants successfully created and registered to training.`,
        {
          totalParticipants: successfulCreations.length,
          data: successfulCreations,
        },
        201
      )
    );

  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Bulk participant upload error:", error);
    return res.status(500).send(
      errorResponse(error instanceof Error ? error.message : "Unknown Error", 500)
    );
  } finally {
    await queryRunner.release();
  }
};