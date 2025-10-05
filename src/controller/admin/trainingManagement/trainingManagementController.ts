import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { training } from "@/model/training";
import Joi from "joi";
import { successResponse, validationResponse } from "@/utils/response";
import { trainingCoach } from "@/model/trainingCoach";
import { categoryTraining } from "@/model/categoryTraining";

const trainingRepository = AppDataSource.getRepository(training);
const trainingCoachRepository = AppDataSource.getRepository(trainingCoach);
const categoryTrainingRepository = AppDataSource.getRepository(categoryTraining)

export const getAllTraining = async (req: Request, res: Response) => {
  try {
    const {
      trainingName,
      categoryId, // filter pakai id dari categoryTraining
      coachId, // filter pakai id dari trainingCoach
      start_date,
      end_date,
      limit: queryLimit,
      page,
    } = req.query;

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (start_date) {
      startDate = new Date(start_date as string);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid start_date format. Expected YYYY-MM-DD.",
        });
      }
    }

    if (end_date) {
      endDate = new Date(end_date as string);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          msg: "Invalid end_date format. Expected YYYY-MM-DD.",
        });
      }
    }

    const queryBuilder = trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.trainingParticipant", "trainingParticipant")
      .leftJoinAndSelect("trainingParticipant.participant", "participant")
      .leftJoinAndSelect("training.categoryTraining", "categoryTraining")
      .leftJoinAndSelect("training.trainingCoach", "trainingCoach")
      .orderBy("training.createdAt", "DESC");

    // 🔍 Filter berdasarkan nama pelatihan
    if (trainingName) {
      queryBuilder.andWhere("training.trainingName LIKE :trainingName", {
        trainingName: `%${String(trainingName)}%`,
      });
    }

    // 🔍 Filter berdasarkan kategori
    if (categoryId) {
      queryBuilder.andWhere("categoryTraining.id = :categoryId", {
        categoryId: String(categoryId),
      });
    }

    // 🔍 Filter berdasarkan coach
    if (coachId) {
      queryBuilder.andWhere("trainingCoach.id = :coachId", {
        coachId: String(coachId),
      });
    }

    // 🔍 Filter berdasarkan tanggal
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.startDateTraining <= :endDate",
        { startDate, endDate }
      );
    }

    const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : 10;
    const currentPage = page ? parseInt(page as string) : 1;
    const skip = (currentPage - 1) * dynamicLimit;

    const [rawData, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit)
      .getManyAndCount();

    // 🎯 Transformasi hasil
    const data = rawData.map((training) => {
      // Pastikan trainingParticipant bisa diolah sebagai array
      const trainingParticipants = Array.isArray(training.trainingParticipant)
        ? training.trainingParticipant
        : training.trainingParticipant
        ? [training.trainingParticipant]
        : [];

      return {
        id: training.id,
        trainingName: training.trainingName,
        price: training.price,
        startDateTraining: training.startDateTraining,
        endDateTraining: training.endDateTraining,
        category: training.categoryTraining
          ? {
              id: training.categoryTraining.id,
              name: training.categoryTraining.categoryName,
              code: training.categoryTraining.trainingCode,
            }
          : null,
        coach: training.trainingCoach
          ? {
              id: training.trainingCoach.id,
              name: training.trainingCoach.coachName,
            }
          : null,
        totalParticipants: trainingParticipants.length,
        participants: trainingParticipants.map((tp) => ({
          id: tp.participant?.id,
          firstName: tp.participant?.firstName,
          lastName: tp.participant?.lastName,
          email: tp.participant?.email,
          company: tp.participant?.company,
          status: tp.status,
        })),
      };
    });

    return res.status(200).send(
      successResponse(
        "Get Training Success",
        {
          data,
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




export const getTrainingtById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.trainingParticipant", "trainingParticipant")
      .leftJoinAndSelect("trainingParticipant.participant", "participant")
      .leftJoinAndSelect("training.categoryTraining", "categoryTraining")
      .leftJoinAndSelect("training.trainingCoach", "trainingCoach")
      .where("training.id = :id", { id })
      .getOne();

    if (!result) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    // Pastikan relasi trainingParticipant bisa dibaca sebagai array
    const trainingParticipants = Array.isArray(result.trainingParticipant)
      ? result.trainingParticipant
      : result.trainingParticipant
      ? [result.trainingParticipant]
      : [];

    // ✅ Transformasi hasil agar lebih rapi
    const trainingDetail = {
      id: result.id,
      trainingName: result.trainingName,
      price: result.price,
      startDateTraining: result.startDateTraining,
      endDateTraining: result.endDateTraining,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,

      category: result.categoryTraining
        ? {
            id: result.categoryTraining.id,
            name: result.categoryTraining.categoryName,
            code: result.categoryTraining.trainingCode,
          }
        : null,

      coach: result.trainingCoach
        ? {
            id: result.trainingCoach.id,
            name: result.trainingCoach.coachName,
          }
        : null,

      totalParticipants: trainingParticipants.length,
      participants: trainingParticipants.map((tp) => ({
        id: tp.participant?.id,
        firstName: tp.participant?.firstName,
        lastName: tp.participant?.lastName,
        email: tp.participant?.email,
        company: tp.participant?.company,
        status: tp.status,
      })),
    };

    return res
      .status(200)
      .send(
        successResponse(
          "Get Training by ID Success",
          { data: trainingDetail },
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



export const createTraining = async (req: Request, res: Response) => {
  const createTrainingSchema = (input: any) =>
    Joi.object({
      trainingName: Joi.string().required(),
      category: Joi.string().required(),
      coach: Joi.string().required(),
      price: Joi.number().min(0).required(),
      startDateTraining: Joi.date().required(),
      endDateTraining: Joi.date().required(),
    }).validate(input);
  try {
    const body = req.body;
    const schema = createTrainingSchema(req.body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const trainingCategory = await categoryTrainingRepository.findOneBy({
      id: body.training,
    });
    if (!trainingCategory) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    const trainingCoach = await trainingCoachRepository.findOneBy({
      id: body.coach,
    });
    if (!trainingCoach) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    const newTraining = new training();
    newTraining.trainingName = body.trainingName;
    newTraining.category = body.category;
    newTraining.categoryTraining = trainingCategory;
    newTraining.trainingCoach = trainingCoach;
    newTraining.price = body.price;
    newTraining.startDateTraining = body.startDateTraining;
    newTraining.endDateTraining = body.endDateTraining;
    console.info("before save :", newTraining);
    await trainingRepository.save(newTraining);

    return res
      .status(201)
      .send(
        successResponse(
          "Training created successfully",
          { data: newTraining },
          201,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const updateTraining = async (req: Request, res: Response) => {
  const updateTrainingSchema = (input: any) =>
    Joi.object({
      trainingName: Joi.string().optional(),
      category: Joi.string().optional(),
      coach: Joi.string().optional(),
      price: Joi.number().min(0).optional(),
      startDateTraining: Joi.date().optional(),
      endDateTraining: Joi.date().optional(),
    }).validate(input);
  try {
    const { id } = req.params;
    const body = req.body;
    const schema = updateTrainingSchema(req.body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const trainingCategory = await categoryTrainingRepository.findOneBy({
      id: body.training,
    });
    if (!trainingCategory) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    const trainingCoach = await trainingCoachRepository.findOneBy({
      id: body.coach,
    });
    if (!trainingCoach) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    const updateTraining = await trainingRepository.findOneBy({ id });
    if (!updateTraining) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    updateTraining.trainingName = body.trainingName;
    updateTraining.category = body.category;
    updateTraining.categoryTraining = trainingCategory;
    updateTraining.trainingCoach = trainingCoach;
    updateTraining.price = body.price;
    updateTraining.startDateTraining = body.startDateTraining;
    updateTraining.endDateTraining = body.endDateTraining;

    await trainingRepository.save(updateTraining);

    return res
      .status(200)
      .send(
        successResponse(
          "Update Training Success",
          { data: updateTraining },
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

export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trainingToDelete = await trainingRepository.findOneBy({ id });
    if (!trainingToDelete) {
      return res.status(404).json({ msg: "Training not Found" });
    }

    // Hapus permanen dari database
    await trainingRepository.remove(trainingToDelete);

    return res
      .status(200)
      .send(
        successResponse(
          "Training permanently deleted",
          { data: trainingToDelete },
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
