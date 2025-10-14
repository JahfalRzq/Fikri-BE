import { Request, Response } from 'express';
import Joi from 'joi';
import { AppDataSource } from '@/data-source';
import { successResponse, validationResponse,errorResponse } from '@/utils/response';
import { trainingCategory } from '@/model/training-category';
import { In } from "typeorm";
import { category } from "@/model/category"; // Sesuaikan path jika perlu
import * as xlsx from "xlsx";


const categoryRepository = AppDataSource.getRepository(category)





export const getAllCategory = async (req: Request, res: Response) => {
  try {
    const {
      categoryName,
      trainingCode,
      startDateTraining,
      endDateTraining,
      limit: queryLimit,
      page,
    } = req.query;

    // parse tanggal (jika ada)
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

    // default limit/page
    const limit = queryLimit ? parseInt(queryLimit as string, 10) : 10;
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * limit;

    // build query — join sesuai model:
    const queryBuilder = categoryRepository
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.training", "training")
      .leftJoinAndSelect("category.trainingParticipantCategory", "trainingParticipantCategory")
      .leftJoinAndSelect("trainingParticipantCategory.trainingParticipant", "trainingParticipant")
      .orderBy("category.createdAt", "DESC");

    if (categoryName) {
      queryBuilder.andWhere("category.categoryName LIKE :categoryName", {
        categoryName: `%${String(categoryName)}%`,
      });
    }

    if (trainingCode) {
      queryBuilder.andWhere("category.trainingCode LIKE :trainingCode", {
        trainingCode: `%${String(trainingCode)}%`,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        { startDate, endDate }
      );
    }

    queryBuilder.skip(skip).take(limit);

    const [data, totalCount] = await queryBuilder.getManyAndCount();

    // transform hasil
    const transformedData = data.map((cat) => {
      const totalTrainings = Array.isArray(cat.trainingCategory) ? cat.trainingCategory.length : 0;

      const participantStatuses =
        (Array.isArray(cat.trainingParticipantCategory)
          ? cat.trainingParticipantCategory.flatMap((tpc) =>
              Array.isArray(tpc.trainingParticipant)
                ? tpc.trainingParticipant.map((tp) => ({
                    trainingParticipantId: tp.id,
                    status: tp.status,
                    participantId: tp.participant?.id ?? null,
                  }))
                : []
            )
          : []) || [];

      return {
        id: cat.id,
        categoryName: cat.categoryName,
        trainingCode: cat.trainingCode,
        totalTrainings,
        participantStatuses,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    // ✅ <-- perbaikan utama: tambahkan status code (3rd arg) untuk successResponse
    return res.status(200).send(
      successResponse(
        "Get Category Success",
        {
          data: transformedData,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error) {
    console.error("Error getAllCategory:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const result = await categoryRepository
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.training", "training")
      .leftJoinAndSelect("category.trainingParticipantCategory", "trainingParticipantCategory")
      .leftJoinAndSelect("trainingParticipantCategory.trainingParticipant", "trainingParticipant")
      .leftJoinAndSelect("trainingParticipant.participant", "participant")
      .where("category.id = :id", { id })
      .getOne();

    if (!result) {
      return res.status(404).json({ msg: "Category not found" });
    }

    // Hitung total training
    const totalTrainings = Array.isArray(result.trainingCategory)
      ? result.trainingCategory.length
      : 0;

    // Transform daftar training
    const trainings =
      Array.isArray(result.trainingCategory) && result.trainingCategory.length > 0
        ? result.trainingCategory.map((tc) => ({
            id: tc.training?.id,
            trainingName: tc.training?.trainingName,
            price: tc.training?.price,
            startDateTraining: tc.training?.startDateTraining,
            endDateTraining: tc.training?.endDateTraining,
          }))
        : [];

    // Transform daftar participant + status
    const participantStatuses =
      Array.isArray(result.trainingParticipantCategory) && result.trainingParticipantCategory.length > 0
        ? result.trainingParticipantCategory.flatMap((tpc) =>
            Array.isArray(tpc.trainingParticipant)
              ? tpc.trainingParticipant.map((tp) => ({
                  trainingParticipantId: tp.id,
                  participantId: tp.participant?.id ?? null,
                  firstName: tp.participant?.firstName ?? null,
                  lastName: tp.participant?.lastName ?? null,
                  email: tp.participant?.email ?? null,
                  status: tp.status,
                }))
              : []
          )
        : [];

    // bentuk response data
    const categoryDetail = {
      id: result.id,
      categoryName: result.categoryName,
      trainingCode: result.trainingCode,
      totalTrainings,
      trainings,
      participantStatuses,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return res
      .status(200)
      .send(
        successResponse(
          "Get Category by ID Success",
          { data: categoryDetail },
          200
        )
      );
  } catch (error) {
    console.error("Error getCategoryById:", error);
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

export const createCategory = async (req: Request, res: Response) => {
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
            const existingCategory = await categoryRepository.findOneBy({ trainingCode });
            if (existingCategory) {
                return res.status(400).send(validationResponse('category training already used'));
            }
        }

        const newCategory = new category();
        newCategory.categoryName = categoryName;
        newCategory.trainingCode = trainingCode;

        await categoryRepository.save(newCategory);

        return res.status(201).send(successResponse('Category created successfully', { data: newCategory }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

const updateCategorySchema = (input: any) =>
    Joi.object({
        categoryName: Joi.string().optional(),
        trainingCode: Joi.string().optional().allow(null),
    }).validate(input);

export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const schema = updateCategorySchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }
        const category = await categoryRepository.findOneBy({ id });
        if (!category) {
            return res.status(404).json({ msg: "Category Training Not Found" });
        }

        // Update fields if provided
        if (body.categoryName !== undefined) category.categoryName = body.categoryName;
        if (body.trainingCode !== undefined) category.trainingCode = body.trainingCode;

        // Cek apakah trainingCode sudah terdaftar untuk kategori lain
        if (body.trainingCode) {
            const existingCategory = await categoryRepository.findOneBy({ trainingCode: body.trainingCode });
            if (existingCategory && existingCategory.id !== category.id) {
                return res.status(400).send(validationResponse('trainingCode already used by another category'));
            }
        }

        await categoryRepository.save(category);

        return res
            .status(200)
            .send(
                successResponse(
                    "Update Category Success",
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

export const deleteCategory = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const category = await categoryRepository.findOneBy({ id });
        if (!category) {
            return res.status(404).send(validationResponse('Category  not found'));
        }

        await categoryRepository.remove(category);

        return res.status(201).send(successResponse('Category deleted successfully', { data: category }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

export const bulkCreateCategories = async (req: Request, res: Response) => {
    try {
        // 1. Validasi File Upload
        if (!req.file) {
            return res.status(400).send(errorResponse("No Excel file uploaded.", 400));
        }

        // 2. Baca dan Parse File Excel
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const dataFromExcel: any[] = xlsx.utils.sheet_to_json(worksheet);

        if (dataFromExcel.length === 0) {
            return res.status(400).send(errorResponse("Excel file is empty.", 400));
        }

        // 3. Validasi Data & Cek Duplikasi
        const newCategories: category[] = [];
        const validationErrors: string[] = [];
        const trainingCodesInFile = new Set<string>();

        // Kumpulkan semua trainingCode dari Excel untuk dicek ke DB sekali saja
        const codesToCheck = dataFromExcel
            .map(row => row.trainingCode)
            .filter(code => code); // Filter yang kosong atau null

        // Cek duplikasi di database dalam satu query
        const existingCategories = await categoryRepository.findBy({
            trainingCode: In(codesToCheck)
        });
        const existingCodes = new Set(existingCategories.map(cat => cat.trainingCode));

        for (let i = 0; i < dataFromExcel.length; i++) {
            const row = dataFromExcel[i];
            const categoryName = row.categoryName;
            const trainingCode = row.trainingCode;

            // Validasi nama kategori
            if (!categoryName || typeof categoryName !== 'string' || categoryName.trim() === '') {
                validationErrors.push(`Row ${i + 2}: categoryName is required.`);
                continue;
            }

            if (trainingCode) {
                // Cek duplikasi di dalam file Excel itu sendiri
                if (trainingCodesInFile.has(trainingCode)) {
                    validationErrors.push(`Row ${i + 2}: trainingCode '${trainingCode}' is duplicated in the Excel file.`);
                    continue;
                }
                // Cek duplikasi dengan yang sudah ada di database
                if (existingCodes.has(trainingCode)) {
                    validationErrors.push(`Row ${i + 2}: trainingCode '${trainingCode}' already exists in the database.`);
                    continue;
                }
                trainingCodesInFile.add(trainingCode);
            }

            const newCategory = new category();
            newCategory.categoryName = categoryName.trim();
            newCategory.trainingCode = trainingCode ? String(trainingCode).trim() : '';
            newCategories.push(newCategory);
        }

        if (validationErrors.length > 0) {
            const errorMessage = `Validation failed. Errors: ${validationErrors.join(', ')}`;
            return res.status(422).send(errorResponse(errorMessage, 422));
        }

        // 4. Simpan ke Database
        const createdCategories = await categoryRepository.save(newCategories);

        // 5. Kirim Response Sukses
        return res.status(201).send(
            successResponse(
                `${createdCategories.length} categories created successfully.`,
                {
                    totalCreated: createdCategories.length,
                    data: createdCategories,
                },
                201
            )
        );

    } catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).send(
            errorResponse(
                error instanceof Error ? error.message : "An unknown error occurred.",
                500
            )
        );
    }
};