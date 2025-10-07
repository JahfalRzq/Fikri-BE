import { Request, Response } from 'express';
import Joi from 'joi';
import { AppDataSource } from '@/data-source';
import { errorResponse, successResponse, validationResponse } from '@/utils/response';
import { coach } from '@/model/coach';

const trainingCoachRepository = AppDataSource.getRepository(coach);

export const getAllTrainingCoaches = async (req: Request, res: Response) => {
    try {
        const {
            coachName,
            limit: queryLimit,
            page,
        } = req.query;

        const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : null;
        const currentPage = page ? parseInt(page as string) : 1; // Convert page to number, default to 1
        const skip = (currentPage - 1) * (dynamicLimit || 0);

        const queryBuilder = trainingCoachRepository
            .createQueryBuilder("coach")
            .leftJoinAndSelect("coach.training", "training")
            .orderBy("coach.createdAt", "DESC");

        if (coachName) {
            queryBuilder.andWhere("coach.coachName LIKE :coachName", {
                coachName: `%${coachName}%`,
            });
        }

        queryBuilder.skip(skip).take(dynamicLimit || undefined);

        const [data, totalCount] = await queryBuilder.getManyAndCount();

        // Transform data to include totalTrainings
        const transformedData = data.map((coach) => {
            let totalTrainings = 0;
            if (coach.training && Array.isArray(coach.training)) {
                totalTrainings = coach.training.length;
            }
            return {
                ...coach,
                totalTrainings: totalTrainings,
                training: undefined, // Remove training array from response
            };
        });

        return res.status(200).send(
            successResponse(
                "Get Training Coaches Success",
                {
                    data: transformedData,
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

export const getTrainingCoachById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const result = await trainingCoachRepository
            .createQueryBuilder("coach")
            .leftJoinAndSelect("coach.training", "training")
            .where("coach.id = :id", { id })
            .getOne();

        if (!result) return res.status(404).json({ msg: "Training Coach Not Found" });

        // Transform data to include totalTrainings
        let totalTrainings = 0;
        if (result.training && Array.isArray(result.training)) {
            totalTrainings = result.training.length;
        }

        const coachWithTrainings = {
            ...result,
            totalTrainings: totalTrainings,
            training: undefined, // Remove the original training property
        };

        return res
            .status(200)
            .send(
                successResponse(
                    "Get Training Coach by ID Success",
                    { coachWithTrainings },
                    200,
                ),
            );
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

export const createTrainingCoach = async (req: Request, res: Response) => {
    const createTrainingCoachSchema = (input: any) =>
    Joi.object({
        coachName: Joi.string().required(),
    }).validate(input);

    try {
        const body = req.body;
        const schema = createTrainingCoachSchema(body);
        if ("error" in schema) {
            return res.status(422).send(validationResponse(schema));
        }

        const { coachName } = body;

        const newCoach = new coach();
        newCoach.coachName = coachName;

        await trainingCoachRepository.save(newCoach);

        return res.status(201).send(successResponse('Training Coach created successfully', { newCoach }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

export const updateTrainingCoach = async (req: Request, res: Response) => {
  const updateTrainingCoachSchema = (input: any) =>
    Joi.object({
      coachName: Joi.string().optional(),
    }).validate(input);

  try {
    const { id } = req.params;
    const body = req.body;
    const schema = updateTrainingCoachSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // Cari coach berdasarkan ID
    const existingCoach = await trainingCoachRepository.findOneBy({ id });
    if (!existingCoach) {
      return res.status(404).json({ msg: "Training Coach not found" });
    }

    // Update field yang ada
    if (body.coachName) existingCoach.coachName = body.coachName;

    await trainingCoachRepository.save(existingCoach);

    return res
      .status(200)
      .send(
        successResponse(
          "Training Coach updated successfully",
          { updatedCoach: existingCoach },
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


export const deleteTrainingCoach = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const coach = await trainingCoachRepository.findOneBy({ id });
        if (!coach) {
            return res.status(404).send(validationResponse('Training Coach not found'));
        }

        await trainingCoachRepository.remove(coach);

        return res.status(201).send(successResponse('Coach deleted successfully', { data: coach }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};