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
} from "@/utils/response";
import { trainingParticipant,statusTraining } from "@/model/training-participant";

const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);
const trainingParticipantRepository = AppDataSource.getRepository(trainingParticipant)
const trainingParticipantCategoryRepository = AppDataSource.getRepository(trainingParticipantCategory);



export const getParticipantsByTrainingId = async (req: Request, res: Response) => {
  // try {
  //   const trainingId = req.params.id;

  //   // Query params
  //   const page = parseInt(req.query.page as string, 10) || 1;
  //   const limit = parseInt(req.query.limit as string, 10) || 10;
  //   const search = (req.query.search as string) || "";
  //   const status = (req.query.status as string) || ""; // ✅ filter status

  //   const skip = (page - 1) * limit;

  //   // 🔍 Build query dari participantRepository
  //   const queryBuilder = participantRepository
  //     .createQueryBuilder("participant")
  //     .leftJoinAndSelect("participant.user", "user")
  //     .leftJoinAndSelect("participant.trainingParticipant", "tp")
  //     .leftJoinAndSelect("tp.training", "training")
  //     .orderBy("participant.createdAt", "DESC");

  //   // ✅ Filter hanya peserta yang terdaftar di training tertentu
  //   if (trainingId) {
  //     queryBuilder.andWhere("training.id = :trainingId", { trainingId });
  //   }

  //   // ✅ Filter berdasarkan status (opsional)
  //   if (status && Object.values(statusTraining).includes(status as statusTraining)) {
  //     queryBuilder.andWhere("tp.status = :status", { status });
  //   }

  //   // ✅ Multi-field search
  //   if (search) {
  //     queryBuilder.andWhere(
  //       `(participant.firstName LIKE :search 
  //         OR participant.lastName LIKE :search 
  //         OR participant.email LIKE :search 
  //         OR user.userName LIKE :search 
  //         OR user.email LIKE :search)`,
  //       { search: `%${search}%` }
  //     );
  //   }

  //   // ✅ Pagination
  //   queryBuilder.skip(skip).take(limit);

  //   const [participants, totalCount] = await queryBuilder.getManyAndCount();

  //   // ✅ Transform hasil agar rapi + tampilkan semua training yang pernah diikuti
  //   const safeData = participants.map((p) => {
  //     const trainingsArray = Array.isArray(p.trainingParticipant)
  //       ? p.trainingParticipant
  //       : p.trainingParticipant
  //       ? [p.trainingParticipant]
  //       : []; // aman jika bukan array

  //     return {
  //       id: p.id,
  //       firstName: p.firstName,
  //       lastName: p.lastName,
  //       email: p.email,
  //       company: p.company,
  //       jobTitle: p.jobTitle,
  //       phone: p.phone,
  //       message: p.message,
  //       createdAt: p.createdAt,
  //       user: p.user
  //         ? {
  //             id: p.user.id,
  //             userName: p.user.userName,
  //             role: p.user.role,
  //             image: p.user.image,
  //           }
  //         : null,
  //       trainings: trainingsArray.map((tp: any) => ({
  //         trainingParticipantId: tp.id,
  //         status: tp.status,
  //         joinedAt: tp.createdAt,
  //         training: tp.training
  //           ? {
  //               id: tp.training.id,
  //               name: tp.training.trainingName,
  //               startDate: tp.training.startDateTraining,
  //               endDate: tp.training.endDateTraining,
  //             }
  //           : null,
  //       })),
  //     };
  //   });

  //   const totalPages = Math.ceil(totalCount / limit);

  //   return res.status(200).send(
  //     successResponse(
  //       "Get Participants by Training ID Success",
  //       {
  //         data: safeData,
  //         totalCount,
  //         currentPage: page,
  //         totalPages,
  //       },
  //       200
  //     )
  //   );
  // } catch (error: any) {
  //   return res.status(500).json({
  //     message: error instanceof Error ? error.message : "Unknown error occurred",
  //   });
  // }
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
  const createParticipantSchema = (input: any) =>
    Joi.object({
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),
      training: Joi.string().required(),
      isExisting: Joi.boolean().required(),
      participantId: Joi.string().optional(),
      user: Joi.string().required(),
    }).validate(input);

  try {
    const body = req.body;
    const schema = createParticipantSchema(body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
      relations: ["trainingCategory", "trainingCategory.category"],
    });
    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    let selectedParticipant: participant | null = null;

    // ✅ CASE: Existing participant
    if (body.isExisting && body.participantId) {
      selectedParticipant = await participantRepository.findOne({
        where: { id: body.participantId },
        relations: ["user"],
      });

      if (!selectedParticipant) {
        return res.status(404).json({ msg: "Participant Not Found" });
      }

      // cek apakah sudah ada relasi
      const existingRel = await trainingParticipantRepository.findOne({
        where: {
          training: { id: trainingRec.id },
          participant: { id: selectedParticipant.id },
        },
      });

      if (existingRel) {
        if (
          existingRel.status === statusTraining.belumMulai ||
          existingRel.status === statusTraining.sedangBerlangsung
        ) {
          return res.status(409).json({
            msg: "Participant already registered and still active in this training",
          });
        }
      }

      // buat relasi baru
      const newRel = new trainingParticipant();
      newRel.training = trainingRec;
      newRel.participant = selectedParticipant;
      newRel.status = statusTraining.belumMulai;

      await trainingParticipantRepository.save(newRel);

      // 🔹 buat trainingParticipantCategory berdasarkan trainingCategory
      for (const tc of trainingRec.trainingCategory) {
        const newTPC = new trainingParticipantCategory();
        // karena modelnya array, kita cast agar tidak error
        (newTPC as any).trainingParticipant = [newRel];
        (newTPC as any).category = tc.category;
        await trainingParticipantCategoryRepository.save(newTPC);
      }

      return res.status(201).send(
        successResponse(
          "Existing participant added to training",
          { participant: selectedParticipant },
          201
        )
      );
    }

    // ✅ CASE: New participant
    const userRecord = await userRepository.findOneBy({ id: body.user });
    if (!userRecord) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const newParticipant = new participant();
    newParticipant.email = body.email;
    newParticipant.firstName = body.firstName;
    newParticipant.lastName = body.lastName;
    newParticipant.company = body.company;
    newParticipant.companyAddress = body.companyAddress;
    newParticipant.phone = body.phone;
    newParticipant.jobTitle = body.jobTitle;
    newParticipant.officePhone = body.officePhone;
    newParticipant.message = body.message;
    newParticipant.user = userRecord;

    await participantRepository.save(newParticipant);

    const newParticipantTraining = new trainingParticipant();
    newParticipantTraining.training = trainingRec;
    newParticipantTraining.participant = newParticipant;
    newParticipantTraining.status = statusTraining.belumMulai;

    await trainingParticipantRepository.save(newParticipantTraining);

    // 🔹 buat trainingParticipantCategory juga
    for (const tc of trainingRec.trainingCategory) {
      const newTPC = new trainingParticipantCategory();
      (newTPC as any).trainingParticipant = [newParticipantTraining];
      (newTPC as any).category = tc.category;
      await trainingParticipantCategoryRepository.save(newTPC);
    }

    return res.status(201).send(
      successResponse(
        "New participant created and added to training",
        { participant: newParticipant },
        201
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};











export const updateParticipant = async (req: Request, res: Response) => {
  const updateParticipantSchema = (input: any) =>
    Joi.object({
      id: Joi.string().required(), // participant id wajib
      training: Joi.string().required(), // training id wajib
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
    }).validate(input);

  try {
    const body = req.body;
    const schema = updateParticipantSchema(body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔹 Ambil participant
    const participantRec = await participantRepository.findOne({
      where: { id: body.id },
      relations: ["user"],
    });

    if (!participantRec) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // 🔹 Ambil training
    const trainingRec = await trainingRepository.findOne({
      where: { id: body.training },
      relations: ["trainingCategory", "trainingCategory.category"],
    });

    if (!trainingRec) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // 🔹 Update info participant (jika ada perubahan)
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

    // 🔹 Ambil relasi trainingParticipant
    let participantTraining = await trainingParticipantRepository.findOne({
      where: {
        training: { id: trainingRec.id },
        participant: { id: participantRec.id },
      },
      relations: ["training", "participant"],
    });

    if (!participantTraining) {
      // jika belum ada, buat baru
      participantTraining = new trainingParticipant();
      participantTraining.training = trainingRec;
      participantTraining.participant = participantRec;
      participantTraining.status = body.status ?? statusTraining.belumMulai;
      await trainingParticipantRepository.save(participantTraining);

      // Buat juga trainingParticipantCategory
      for (const tc of trainingRec.trainingCategory) {
        const newTPC = new trainingParticipantCategory();
        (newTPC as any).trainingParticipant = [participantTraining];
        (newTPC as any).category = tc.category;
        await trainingParticipantCategoryRepository.save(newTPC);
      }
    } else {
      // jika sudah ada, update status
      participantTraining.status = body.status ?? participantTraining.status;
      await trainingParticipantRepository.save(participantTraining);
    }

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
  // try {
  //   const { id } = req.params;

  //   const participantToDelete = await participantRepository.findOne({
  //     where: { id },
  //     relations: ["trainingParticipant"], // penting: ambil relasi
  //   });

  //   if (!participantToDelete) {
  //     return res.status(404).json({ msg: "Participant not Found" });
  //   }

  //   // pastikan relasi selalu array
  //   const relatedTPs = Array.isArray(participantToDelete.trainingParticipant)
  //     ? participantToDelete.trainingParticipant
  //     : participantToDelete.trainingParticipant
  //       ? [participantToDelete.trainingParticipant]
  //       : [];

  //   // hapus semua relasi trainingParticipant terlebih dahulu
  //   if (relatedTPs.length > 0) {
  //     await trainingParticipantStory.remove(relatedTPs);
  //   }

  //   // lalu hapus participant
  //   await participantRepository.remove(participantToDelete);

  //   return res
  //     .status(200)
  //     .send(
  //       successResponse(
  //         "Participant and related trainingParticipant deleted successfully",
  //         { data: participantToDelete },
  //         200
  //       )
  //     );
  // } catch (error) {
  //   return res.status(500).json({
  //     message: error instanceof Error ? error.message : "Unknown error occurred",
  //   });
  // }
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
  try {
    const { id } = req.params;

    await participantRepository.restore(id);
    await trainingParticipantRepository
      .createQueryBuilder()
      .restore()
      .where("participantId = :id", { id })
      .execute();

    return res.status(200).send(
      successResponse("Participant restored successfully", { id }, 200)
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

