import { Request, Response } from 'express';
import Joi from 'joi';
import { AppDataSource } from '@/data-source';
import { successResponse, validationResponse } from '@/utils/response';
import { categoryTraining } from '@/model/category-training';

const categoryTrainingRepository = AppDataSource.getRepository(categoryTraining);

export const getAllCategoryTrainings = async (req: Request, res: Response) => {
    try {
        const {
            categoryName,
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

        const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : null;
        const currentPage = page ? parseInt(page as string) : 1; // Convert page to number, default to 1
        const skip = (currentPage - 1) * (dynamicLimit || 0);

        const queryBuilder = categoryTrainingRepository
            .createQueryBuilder("category")
            .leftJoinAndSelect("category.training", "training")
            .orderBy("category.createdAt", "DESC");

        if (categoryName) {
            queryBuilder.andWhere("category.categoryName LIKE :categoryName", {
                categoryName: `%${categoryName}%`,
            });
        }

        if (trainingCode) {
            queryBuilder.andWhere("category.trainingCode LIKE :trainingCode", {
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

        queryBuilder.skip(skip).take(dynamicLimit || undefined);

        const [data, totalCount] = await queryBuilder.getManyAndCount();

        // Transform data to include totalTrainings
        const transformedData = data.map((category) => {
            let totalTrainings = 0;
            if (category.training && Array.isArray(category.training)) {
                totalTrainings = category.training.length;
            }
            return {
                ...category,
                totalTrainings: totalTrainings,
                training: undefined, // Remove training array from response
            };
        });

        return res.status(200).send(
            successResponse(
                "Get Category Trainings Success",
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

export const getCategoryTrainingById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;

        const result = await categoryTrainingRepository
            .createQueryBuilder("category")
            .leftJoinAndSelect("category.training", "training")
            .where("category.id = :id", { id })
            .getOne();

        if (!result) return res.status(404).json({ msg: "Category Training Not Found" });

        // Transform data to include totalTrainings
        let totalTrainings = 0;
        if (result.training && Array.isArray(result.training)) {
            totalTrainings = result.training.length;
        }

        const categoryWithTrainings = {
            ...result,
            totalTrainings: totalTrainings,
            training: undefined, // Remove the original training property
        };

        return res
            .status(200)
            .send(
                successResponse(
                    "Get Category Training by ID Success",
                    { categoryWithTrainings },
                    200,
                ),
            );
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};
export const createCategoryTraining = async (req: Request, res: Response) => {
    const createCategoryTrainingSchema = (input: any) =>
        Joi.object({
            categoryName: Joi.string().required(),
            trainingCode: Joi.string().optional().allow(null),
        }).validate(input);
    try {
        const body = req.body;
        const schema = createCategoryTrainingSchema(body);
      if ("error" in schema) {
            return res.status(422).send(validationResponse(schema));
        }


        const { categoryName, trainingCode } = body;

        // Cek apakah trainingCode sudah terdaftar
        if (trainingCode) {
            const existingCategory = await categoryTrainingRepository.findOneBy({ trainingCode });
            if (existingCategory) {
                return res.status(400).send(validationResponse('trainingCode already used'));
            }
        }

        const newCategory = new categoryTraining();
        newCategory.categoryName = categoryName;
        newCategory.trainingCode = trainingCode;

        await categoryTrainingRepository.save(newCategory);

        return res.status(201).send(successResponse('Category Training created successfully', { data: newCategory }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

const updateCategoryTrainingSchema = (input: any) =>
    Joi.object({
        categoryName: Joi.string().optional(),
        trainingCode: Joi.string().optional().allow(null),
    }).validate(input);

export const updateCategoryTraining = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const schema = updateCategoryTrainingSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }
        const category = await categoryTrainingRepository.findOneBy({ id });
        if (!category) {
            return res.status(404).json({ msg: "Category Training Not Found" });
        }

        // Update fields if provided
        if (body.categoryName !== undefined) category.categoryName = body.categoryName;
        if (body.trainingCode !== undefined) category.trainingCode = body.trainingCode;

        // Cek apakah trainingCode sudah terdaftar untuk kategori lain
        if (body.trainingCode) {
            const existingCategory = await categoryTrainingRepository.findOneBy({ trainingCode: body.trainingCode });
            if (existingCategory && existingCategory.id !== category.id) {
                return res.status(400).send(validationResponse('trainingCode already used by another category'));
            }
        }

        await categoryTrainingRepository.save(category);

        return res
            .status(200)
            .send(
                successResponse(
                    "Update Category Training Success",
                    { data: category },
                    200,
                ),
            );
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

export const deleteCategoryTraining = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const category = await categoryTrainingRepository.findOneBy({ id });
        if (!category) {
            return res.status(404).send(validationResponse('Category Training not found'));
        }

        await categoryTrainingRepository.remove(category);

        return res.status(201).send(successResponse('Category deleted successfully', { data: category }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};