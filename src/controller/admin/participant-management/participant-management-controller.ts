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

    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category").orderBy("participant.createdAt", "DESC");

    // ✅ Filter hanya peserta dalam training tertentu
    if (trainingId) {
      queryBuilder.andWhere("training.id = :trainingId", { trainingId });
    }

    // ✅ Filter status training (optional)
    if (status && Object.values(statusTraining).includes(status as statusTraining)) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // ✅ Search multi-field
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

    const [participants, totalCount] = await queryBuilder.getManyAndCount();

    // ✅ Transform hasil
    const safeData = participants.map((p) => {
      const trainingInfo = p.trainingParticipant.find((tp: any) => tp.training?.id === trainingId);

      // Ekstrak kategori dari trainingCategory
      const categoriesArray = trainingInfo?.training?.trainingCategory?.map((tc: any) => tc.category) || [];

      // Ambil kategori pertama dari array, atau null jika tidak ada
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
        status: trainingInfo?.status ?? "unknown",
        training: trainingInfo?.training
          ? {
            id: trainingInfo.training.id,
            trainingName: trainingInfo.training.trainingName,
            startDateTraining: trainingInfo.training.startDateTraining,
            endDateTraining: trainingInfo.training.endDateTraining,
            category: firstCategory,
          }
          : null,
      };
    });

    return res.status(200).send(
      successResponse(
        "Get Participants by Training ID Success",
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
