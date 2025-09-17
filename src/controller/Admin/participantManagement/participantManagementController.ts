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

export const getParticipantsByTrainingId = async (
  req: Request,
  res: Response,
) => {
  try {
    const trainingId = req.params.id;

    // ambil query params untuk pagination & search
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const skip = (page - 1) * limit;

    // buat kondisi pencarian
    const whereCondition: any = {
      training: { id: trainingId },
    };

    if (search) {
      whereCondition["email"] = Like(`%${search}%`);
      // atau multi field:
      // pake queryBuilder lebih fleksibel (lihat bawah)
    }

    // jika mau multi-field search lebih baik pakai queryBuilder
    const queryBuilder = participantRepository
      .createQueryBuilder("participant")
      .leftJoinAndSelect("participant.training", "training")
      .where("training.id = :trainingId", { trainingId });

    if (search) {
      queryBuilder.andWhere(
        "(participant.firstName LIKE :search OR participant.lastName LIKE :search OR participant.email LIKE :search)",
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy("participant.createdAt", "DESC");

    const [participants, totalCount] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).send(
      successResponse(
        "Get Participants by Training ID Success",
        {
          data: participants,
          totalCount,
          currentPage: page,
          totalPages,
        },
        200,
      ),
    );
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
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

    const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : null;
    const currentPage = page ? parseInt(page as string) : 1; // Convert page to number, default to 1
    const skip = (currentPage - 1) * (dynamicLimit || 0);

    const [data, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit || undefined)
      .getManyAndCount();

    return res.status(200).send(
      successResponse(
        "Get Participant Success",
        {
          data,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / (dynamicLimit || 1)),
        },
        200,
      ),
    );
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Unknown error occurred' });
  }
};

export const getParticipanttById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await participantRepository.findOneBy({ id });
    if (!result) return res.status(404).json({ msg: "Participant Not Found" });
    return res
      .status(200)
      .send(
        successResponse("Get Participant by ID Success", { data: result }, 200),
      );
  } catch (error) {
    return res.status(500).json({ 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
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
    }).validate(input);

  try {
    const body = req.body;
    const schema = createParticipantSchema(req.body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const trainingType = await trainingRepository.findOneBy({
      id: body.training,
    });
    if (!trainingType) {
      return res.status(404).json({ msg: "Training Not Found" });
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
    newParticipant.training = trainingType;

    await participantRepository.save(newParticipant);

    const newUser = new user();
    newUser.email = newParticipant.email;
    newUser.userName = newParticipant.firstName;
    newUser.phone = newParticipant.phone;
    newUser.password = newParticipant.firstName + `${"123)(*"}`;
    newUser.hashPassword();
    newUser.role = UserRole.PARTICIPANT;
    newUser.participantId = newParticipant; // Gunakan entitas newParticipant langsung

    await userRepository.save(newUser);

    return res
      .status(201)
      .send(
        successResponse(
          "Participant created successfully",
          { data: newParticipant, user: newUser },
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
    }).validate(input);

  try {
    const { id } = req.params;
    const body = req.body;
    const schema = updateParticipantSchema(req.body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
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

    await participantRepository.save(existingParticipant);

    // Update user details associated with the participant
    const userParticipant = await userRepository.findOneBy({
      participantId: { id: existingParticipant.id },
    });
    
    if (userParticipant) {
      userParticipant.email = existingParticipant.email;
      userParticipant.userName = existingParticipant.firstName;
      userParticipant.phone = existingParticipant.phone;
      userParticipant.hashPassword();
      userParticipant.role = UserRole.PARTICIPANT;
      await userRepository.save(userParticipant);
    }

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

    // Hapus pengguna yang terkait dengan peserta
    const userParticipant = await userRepository.findOneBy({
      participantId: { id: participantToDelete.id },
    });
    if (userParticipant) {
      await userRepository.remove(userParticipant);
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
