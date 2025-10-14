import { Request, Response } from 'express';
import Joi from 'joi';
import { AppDataSource } from '@/data-source';
import { errorResponse, successResponse, validationResponse } from '@/utils/response';
import { coach } from '@/model/coach';
import * as xlsx from "xlsx";

const trainingCoachRepository = AppDataSource.getRepository(coach);

export const getAllCoaches = async (req: Request, res: Response) => {
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

export const getCoachById = async (req: Request, res: Response) => {
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

export const createCoach = async (req: Request, res: Response) => {
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

export const updateCoach = async (req: Request, res: Response) => {
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


export const deleteCoach = async (req: Request, res: Response) => {
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



export const bulkCreateCoaches = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).send(errorResponse("No Excel file uploaded.", 400));
        }

        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const dataFromExcel: any[] = xlsx.utils.sheet_to_json(worksheet);

        if (dataFromExcel.length === 0) {
            return res.status(400).send(errorResponse("Excel file is empty or has no data.", 400));
        }

        const newCoaches: coach[] = [];
        const validationErrors: string[] = [];

        for (let i = 0; i < dataFromExcel.length; i++) {
            const row = dataFromExcel[i];
            const coachName = row.coachName;

            if (!coachName || typeof coachName !== 'string' || coachName.trim() === '') {
                validationErrors.push(`Row ${i + 2}: coachName is missing or invalid.`);
                continue;
            }

            const newCoach = new coach();
            newCoach.coachName = coachName.trim();
            newCoaches.push(newCoach);
        }

        // ✅ DIUBAH: Perbaiki cara memanggil 'errorResponse'
        if (validationErrors.length > 0) {
            // Gabungkan semua error validasi menjadi satu string pesan
            const errorMessage = `Validation failed for ${validationErrors.length} rows. Errors: ${validationErrors.join(', ')}`;
            return res.status(422).send(errorResponse(errorMessage, 422));
        }

        const createdCoaches = await trainingCoachRepository.save(newCoaches);

        return res.status(201).send(
            successResponse(
                `${createdCoaches.length} coaches created successfully from Excel file.`,
                {
                    totalCreated: createdCoaches.length,
                    data: createdCoaches,
                },
                201
            )
        );

    } catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).send(
            errorResponse(
                error instanceof Error ? error.message : "An unknown error occurred during bulk upload.",
                500
            )
        );
    }
};