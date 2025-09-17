import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { training } from "@/model/training";
import Joi from "joi";
import { successResponse, validationResponse } from "@/utils/response";

const trainingRepository = AppDataSource.getRepository(training);

export const getAllTraining = async (req: Request, res: Response) => {
  try {
    const {
      trainingName,
      category,
      trainingCode,
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
        return res
          .status(400)
          .json({ msg: "Invalid start_date format. Expected YYYY-MM-DD." });
      }
    }

    if (end_date) {
      endDate = new Date(end_date as string);
      if (isNaN(endDate.getTime())) {
        return res
          .status(400)
          .json({ msg: "Invalid end_date format. Expected YYYY-MM-DD." });
      }
    }

    const queryBuilder = trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.participant", "participant")
      .orderBy("training.createdAt", "DESC");

    if (trainingName) {
      queryBuilder.andWhere("training.trainingName LIKE :trainingName", {
        trainingName: `%${String(trainingName)}%`,
      });
    }

    if (category) {
      queryBuilder.andWhere("training.category LIKE :category", {
        category: `%${String(category)}%`,
      });
    }

    if (trainingCode) {
      queryBuilder.andWhere("training.trainingCode LIKE :trainingCode", {
        trainingCode: `%${String(trainingCode)}%`,
      });
    }

    // Apply date range filter if both start_date and end_date are provided
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.startDateTraining <= :endDate",
        {
          startDate,
          endDate,
        },
      );
    }

    const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : null;
    const currentPage = page ? parseInt(page as string) : 1; // Convert page to number, default to 1
    const skip = (currentPage - 1) * (dynamicLimit ?? 0);

    const [rawData, totalCount] = await queryBuilder
      .skip(skip)
      .take(dynamicLimit ?? undefined)
      .getManyAndCount();

    // Transform data to include totalParticipants
    const data = rawData.map((training) => ({
      ...training,
      totalParticipants: training.participant ? training.participant.length : 0,
      participant: undefined, // Remove participant array from response
    }));

    return res.status(200).send(
      successResponse(
        "Get Training Success",
        {
          data,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / (dynamicLimit ?? 1)),
        },
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

export const getTrainingtById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.participant", "participant")
      .where("training.id = :id", { id })
      .getOne();

    if (!result) return res.status(404).json({ msg: "Training Not Found" });

    // Transform data to include totalParticipants
    const trainingWithParticipants = {
      ...result,
      participants: result.participant || [],
      totalParticipants: result.participant ? result.participant.length : 0,
      participant: undefined, // Remove the original participant property
    };

    return res
      .status(200)
      .send(
        successResponse(
          "Get Training by ID Success",
          { data: trainingWithParticipants },
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

export const createTraining = async (req: Request, res: Response) => {
  const createTrainingSchema = (input: any) =>
    Joi.object({
      trainingName: Joi.string().required(),
      category: Joi.string().required(),
      trainingCode: Joi.string().required(),
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

    const newTraining = new training();
    newTraining.trainingName = body.trainingName;
    newTraining.category = body.category;
    newTraining.trainingCode = body.trainingCode;
    newTraining.coach = body.coach;
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
      trainingCode: Joi.string().optional(),
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

    const updateTraining = await trainingRepository.findOneBy({ id });
    if (!updateTraining) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    updateTraining.trainingName = body.trainingName;
    updateTraining.category = body.category;
    updateTraining.trainingCode = body.trainingCode;
    updateTraining.coach = body.coach;
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
