import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { user, UserRole } from "@/model/user";
import Joi from "joi";
import { training } from "@/model/training";
import { participant, statusTraining } from "@/model/participant";
import { Like } from "typeorm";
import {
  successResponse,
  validationResponse,
} from "@/utils/response";

const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);

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

    // Apply date range filter if both startDateTraining and endDateTraining are provided
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        {
          startDate,
          endDate,
        },
      );
    }

    const dynamicLimit = queryLimit ? parseInt(queryLimit as string, 10) : null;
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * (dynamicLimit || 0);

    const [participants, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit || undefined)
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
    }));

    return res.status(200).send(
      successResponse(
        "Get Participant Success",
        {
          data: safeData,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / (dynamicLimit || 1)),
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
      .where("participant.id = :id", { id })
      .getOne();

    if (!result) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    // transform data agar password user tidak ikut ke response
    const safeParticipant = {
      ...result,
      user: result.user
        ? {
            id: result.user.id,
            userName: result.user.userName,
            role: result.user.role,
            image: result.user.image,
          }
        : null,
    };

    return res
      .status(200)
      .send(
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
      email: Joi.string().email().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      company: Joi.string().required(),
      companyAddress: Joi.string().required(),
      phone: Joi.number().min(0).required(),
      jobTitle: Joi.string().required(),
      officePhone: Joi.number().min(0).required(),
      message: Joi.string().required(),
      training: Joi.string().required(),
      user: Joi.string().required(),
    }).validate(input);

  try {
    const body = req.body;
    const schema = createParticipantSchema(req.body);
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
    newParticipant.status = statusTraining.belumMulai;
    newParticipant.training = trainingId;
    newParticipant.user = userId

    await participantRepository.save(newParticipant);

    return res
      .status(201)
      .send(
        successResponse(
          "Participant created successfully",
          { data: newParticipant },
          201,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error occurred'
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
    existingParticipant.status = body.status;
    existingParticipant.training = trainingId
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

    const participantToDelete = await participantRepository.findOneBy({ id });
    if (!participantToDelete) {
      return res.status(404).json({ msg: "Participant not Found" });
    }

    // Hapus peserta dari database
    await participantRepository.remove(participantToDelete);

    return res
      .status(200)
      .send(
        successResponse(
          "Participant permanently deleted",
          { data: participantToDelete },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

export const changeStatusParticipant = async (req: Request, res: Response) => {
  const changeStatusSchema = (input: any) =>
    Joi.object({
      status: Joi.string()
        .valid(...Object.values(statusTraining))
        .required(),
    }).validate(input);

  try {
    const { id } = req.params;
    const body = req.body;
    const schema = changeStatusSchema(req.body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const existingParticipant = await participantRepository.findOneBy({ id });
    if (!existingParticipant) {
      return res.status(404).json({ msg: "Participant not Found" });
    }

    // Update status peserta
    existingParticipant.status = body.status as statusTraining;

    await participantRepository.save(existingParticipant);

    return res
      .status(200)
      .send(
        successResponse(
          "Participant status updated successfully",
          { data: existingParticipant },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};
