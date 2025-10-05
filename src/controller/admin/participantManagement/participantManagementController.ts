import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { user, UserRole } from "@/model/user";
import Joi from "joi";
import { training } from "@/model/training";
import { participant } from "@/model/participant";
import { Like } from "typeorm";
import {
  successResponse,
  validationResponse,
} from "@/utils/response";
import { trainingParticipant,statusTraining } from "@/model/training-participant";

const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);
const trainingParticipantStory = AppDataSource.getRepository(trainingParticipant)

export const getParticipantsByTrainingId = async (req: Request, res: Response) => {
  try {
    const trainingId = req.params.id;

    // query params untuk pagination & search
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";

    const skip = (page - 1) * limit;

    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.training", "training")
      .leftJoinAndSelect("participant.user", "user") // ikutkan relasi user
      .where("training.id = :trainingId", { trainingId });

    // filter pencarian (multi-field)
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search 
          OR participant.lastName LIKE :search 
          OR participant.email LIKE :search 
          OR user.userName LIKE :search 
          OR user.email LIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // pagination & order
    queryBuilder.skip(skip).take(limit).orderBy("participant.createdAt", "DESC");

    const [participants, totalCount] = await queryBuilder.getManyAndCount();

    // transform data -> tambahkan info user tanpa expose password
    const safeData = participants.map((p) => ({
      ...p,
      user: p.user
        ? {
            id: p.user.id,
            userName: p.user.userName,
            role: p.user.role,
            image: p.user.image,
          }
        : null,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).send(
      successResponse(
        "Get Participants by Training ID Success",
        {
          data: safeData,
          totalCount,
          currentPage: page,
          totalPages,
        },
        200,
      ),
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
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
      status, // ✅ filter tambahan: status trainingParticipant
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
      .leftJoinAndSelect("participant.training", "training")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp") // ✅ ikut ambil relasi trainingParticipant
      .orderBy("participant.createdAt", "DESC");

    if (firstName) {
      queryBuilder.andWhere("participant.firstName LIKE :firstName", {
        firstName: `%${firstName}%`,
      });
    }

    if (company) {
      queryBuilder.andWhere("participant.company LIKE :company", {
        company: `%${company}%`,
      });
    }

    if (trainingCode) {
      queryBuilder.andWhere("training.trainingCode LIKE :trainingCode", {
        trainingCode: `%${trainingCode}%`,
      });
    }

    // multi-field search
    if (search) {
      queryBuilder.andWhere(
        `(participant.firstName LIKE :search 
          OR participant.lastName LIKE :search 
          OR participant.email LIKE :search 
          OR user.userName LIKE :search 
          OR user.email LIKE :search)`,
        { search: `%${search}%` },
      );
    }

    // filter status trainingParticipant
    if (status) {
      queryBuilder.andWhere("tp.status = :status", { status });
    }

    // Apply date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        {
          startDate,
          endDate,
        },
      );
    }

    const dynamicLimit = queryLimit ? parseInt(queryLimit as string, 10) : 10; // ✅ default 10
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * dynamicLimit;

    const [participants, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit)
      .getManyAndCount();

    // transform: hilangkan password user
    const safeData = participants.map((p) => ({
      ...p,
      user: p.user
        ? {
            id: p.user.id,
            userName: p.user.userName,
            role: p.user.role,
            image: p.user.image,
          }
        : null,
      trainingParticipant: Array.isArray(p.trainingParticipant)
        ? p.trainingParticipant.map((tp) => ({
            id: tp.id,
            status: tp.status,
            trainingId: tp.training?.id,
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
        200,
      ),
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.training", "training")
      .leftJoinAndSelect("participant.user", "user")
      .leftJoinAndSelect("participant.trainingParticipant", "tp")
      .leftJoinAndSelect("tp.training", "tpTraining") // biar relasi training di trainingParticipant juga keambil
      .where("participant.id = :id", { id })
      .getOne();

    if (!result) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // transform data agar lebih aman dan ringkas
    const safeParticipant = {
      id: result.id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
      company: result.company,
      companyAddress: result.companyAddress,
      phone: result.phone,
      jobTitle: result.jobTitle,
      officePhone: result.officePhone,
      message: result.message,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      deletedAt: result.deletedAt,

      user: result.user
        ? {
            id: result.user.id,
            userName: result.user.userName,
            role: result.user.role,
            image: result.user.image,
          }
        : null,

      training: result.trainingParticipant.training
        ? {
            id: result.trainingParticipant.training,
            trainingName: result.trainingParticipant.training.trainingName,
            trainingCode: result.trainingParticipant.training.categoryTraining.trainingCode,
            startDateTraining: result.trainingParticipant.training.startDateTraining,
            endDateTraining: result.trainingParticipant.training.endDateTraining,
          }
        : null,

      trainingParticipant: Array.isArray(result.trainingParticipant)
        ? result.trainingParticipant.map((tp) => ({
            id: tp.id,
            status: tp.status,
            training: tp.training
              ? {
                  id: tp.training.id,
                  trainingName: tp.training.trainingName,
                  trainingCode: tp.training.trainingCode,
                  startDateTraining: tp.training.startDateTraining,
                  endDateTraining: tp.training.endDateTraining,
                }
              : null,
          }))
        : [],
    };

    return res.status(200).send(
      successResponse(
        "Get Participant by ID Success",
        { data: safeParticipant },
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



export const createParticipant = async (req: Request, res: Response) => {
  const createParticipantSchema = (input: any) =>
    Joi.object({
      // ✅ data umum peserta (wajib untuk new, optional untuk existing)
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),

      // training wajib
      training: Joi.string().required(),

      // flag + relasi user
      isExisting: Joi.boolean().required(),
      participantId: Joi.string().optional(), // dipakai jika existing
      user: Joi.string().required(), // tetap ada relasi user
    }).validate(input);

  try {
    const body = req.body;
    const schema = createParticipantSchema(body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // cek training
    const trainingRecord = await trainingRepository.findOneBy({ id: body.training });
    if (!trainingRecord) {
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

      // cek apakah sudah ada relasi di trainingParticipant
      const existingRel = await trainingParticipantStory.findOne({
        where: {
          training: { id: trainingRecord.id },
          participant: { id: selectedParticipant.id },
        },
      });

      if (existingRel) {
        // ✅ validasi berdasarkan status di trainingParticipant
        if (
          existingRel.status === statusTraining.belumMulai ||
          existingRel.status === statusTraining.sedangBerlangsung
        ) {
          return res.status(409).json({
            msg: "Participant already registered and still active in this training",
          });
        }

        // jika selesai / tidakSelesai → biarkan lanjut (buat relasi baru)
      }

      // buat relasi baru
      const newRel = new trainingParticipant();
      newRel.training = trainingRecord;
      newRel.participant = selectedParticipant;
      newRel.status = statusTraining.belumMulai; // default setiap daftar baru
      await trainingParticipantStory.save(newRel);

      return res.status(201).send(
        successResponse(
          "Existing participant added to training",
          { participant: selectedParticipant, participantTraining: newRel },
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
    newParticipantTraining.training = trainingRecord;
    newParticipantTraining.participant = newParticipant;
    newParticipantTraining.status = statusTraining.belumMulai; // default

    await trainingParticipantStory.save(newParticipantTraining);

    return res.status(201).send(
      successResponse(
        "New participant created and added to training",
        { participant: newParticipant, participantTraining: newParticipantTraining },
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
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.number().min(0).optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.number().min(0).optional(),
      message: Joi.string().optional(),
      status: Joi.string()
        .valid(...Object.values(statusTraining))
        .optional(),
      training: Joi.string().optional(),
      user: Joi.string().optional(),
    }).validate(input);

  try {
    const { id } = req.params;
    const body = req.body;
    const schema = updateParticipantSchema(req.body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const trainingId = await trainingRepository.findOneBy({
      id: body.training,
    });
    if (!trainingId) {
      return res.status(404).json({ msg: "Training Not Found" });
    }


    const userId = await userRepository.findOneBy({
      id: body.userId,
    });
    if (!userId) {
      return res.status(404).json({ msg: "User Not Found" });
    }

    const existingParticipant = await participantRepository.findOneBy({ id });
    if (!existingParticipant) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // Update participant details
    existingParticipant.email = body.email;
    existingParticipant.firstName = body.firstName;
    existingParticipant.lastName = body.lastName;
    existingParticipant.company = body.company;
    existingParticipant.companyAddress = body.companyAddress;
    existingParticipant.phone = body.phone;
    existingParticipant.jobTitle = body.jobTitle;
    existingParticipant.officePhone = body.officePhone;
    existingParticipant.message = body.message;
    existingParticipant.user = userId

    await participantRepository.save(existingParticipant);

    return res
      .status(200)
      .send(
        successResponse(
          "Update Participant Success",
          { existingParticipant },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const deleteParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const participantToDelete = await participantRepository.findOne({
      where: { id },
      relations: ["trainingParticipant"], // penting: ambil relasi
    });

    if (!participantToDelete) {
      return res.status(404).json({ msg: "Participant not Found" });
    }

    // pastikan relasi selalu array
    const relatedTPs = Array.isArray(participantToDelete.trainingParticipant)
      ? participantToDelete.trainingParticipant
      : participantToDelete.trainingParticipant
        ? [participantToDelete.trainingParticipant]
        : [];

    // hapus semua relasi trainingParticipant terlebih dahulu
    if (relatedTPs.length > 0) {
      await trainingParticipantStory.remove(relatedTPs);
    }

    // lalu hapus participant
    await participantRepository.remove(participantToDelete);

    return res
      .status(200)
      .send(
        successResponse(
          "Participant and related trainingParticipant deleted successfully",
          { data: participantToDelete },
          200
        )
      );
  } catch (error) {
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
      trainingId: Joi.string().required(), // ✅ training wajib supaya tahu status mana yang diubah
    }).validate(input);

  try {
    const { id } = req.params; // ini participantId
    const body = req.body;
    const schema = changeStatusSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // pastikan training ada
    const trainingRecord = await trainingRepository.findOneBy({ id: body.trainingId });
    if (!trainingRecord) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // cek relasi participant ↔ training
    const participantTraining = await trainingParticipantStory.findOne({
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

    // ✅ update status
    participantTraining.status = body.status as statusTraining;
    await trainingParticipantStory.save(participantTraining);

    return res.status(200).send(
      successResponse(
        "Participant training status updated successfully",
        { data: participantTraining },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

