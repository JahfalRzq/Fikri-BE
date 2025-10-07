import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { training } from "@/model/training";
import Joi from "joi";
import { successResponse, validationResponse,errorResponse } from "@/utils/response";
import { coach } from "@/model/coach";
import { trainingCategory } from "@/model/training-category";
import { category } from "@/model/category";


const trainingRepository = AppDataSource.getRepository(training);
const coachRepository = AppDataSource.getRepository(coach);
const categoryRepository = AppDataSource.getRepository(category);
const trainingCategoryRepository = AppDataSource.getRepository(trainingCategory);

export const getAllTraining = async (req: Request, res: Response) => {
  try {
    const {
      trainingName,
      coachId,
      categoryId,
      startDate,
      endDate,
      limit: queryLimit,
      page,
    } = req.query;

    const limit = queryLimit ? parseInt(queryLimit as string, 10) : 10;
    const currentPage = page ? parseInt(page as string, 10) : 1;
    const skip = (currentPage - 1) * limit;

    // 🔍 Query builder utama
    const queryBuilder = trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .leftJoinAndSelect("training.trainingCoach", "coach")
      .leftJoinAndSelect("training.trainingParticipant", "trainingParticipant")
      .leftJoinAndSelect("trainingParticipant.participant", "participant")
      .orderBy("training.createdAt", "DESC");

    // Filter berdasarkan nama training
    if (trainingName) {
      queryBuilder.andWhere("training.trainingName LIKE :trainingName", {
        trainingName: `%${trainingName}%`,
      });
    }

    // Filter berdasarkan kategori (relasi category.id)
    if (categoryId) {
      queryBuilder.andWhere("category.id = :categoryId", { categoryId });
    }

    // Filter berdasarkan coach
    if (coachId) {
      queryBuilder.andWhere("coach.id = :coachId", { coachId });
    }

    // Filter tanggal pelatihan
    if (startDate && endDate) {
      queryBuilder.andWhere(
        "training.startDateTraining >= :startDate AND training.endDateTraining <= :endDate",
        { startDate, endDate }
      );
    }

    // Pagination
    queryBuilder.skip(skip).take(limit);

    // Eksekusi query
    const [trainings, totalCount] = await queryBuilder.getManyAndCount();

    // Format response
    const data = trainings.map((t) => {
      // Ambil semua kategori terkait
      const categories =
        t.trainingCategory?.map((tc) => ({
          id: tc.category?.id,
          name: tc.category?.categoryName,
          code: tc.category?.trainingCode,
        })) || [];

      // Ambil semua peserta
      const participants =
        t.trainingParticipant?.map((tp) => ({
          id: tp.participant?.id,
          name: `${tp.participant?.firstName ?? ""} ${tp.participant?.lastName ?? ""}`.trim(),
          email: tp.participant?.email,
          company: tp.participant?.company,
          status: tp.status,
        })) || [];

      return {
        id: t.id,
        trainingName: t.trainingName,
        price: t.price,
        startDateTraining: t.startDateTraining,
        endDateTraining: t.endDateTraining,
        coach: t.trainingCoach
          ? {
              id: t.trainingCoach.id,
              name: t.trainingCoach.coachName,
            }
          : null,
        categories, // array of category objects
        totalParticipants: participants.length,
        participants,
      };
    });

    return res.status(200).send(
      successResponse(
        "Get All Training Success",
        {
          data,
          totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / limit),
        },
        200
      )
    );
  } catch (error) {
    return res.status(500).send(
      errorResponse(
        error instanceof Error ? error.message : "Unknown error occurred",
        500
      )
    );
  }
};




export const getTrainingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await trainingRepository
      .createQueryBuilder("training")
      .leftJoinAndSelect("training.trainingCategory", "trainingCategory")
      .leftJoinAndSelect("trainingCategory.category", "category")
      .leftJoinAndSelect("training.trainingCoach", "coach")
      .leftJoinAndSelect("training.trainingParticipant", "trainingParticipant")
      .leftJoinAndSelect("trainingParticipant.participant", "participant")
      .where("training.id = :id", { id })
      .getOne();

    if (!result) {
      return res
        .status(404)
        .send(errorResponse("Training Not Found", 404));
    }

    // 🔹 Map category (karena relasi OneToMany)
    const categories =
      result.trainingCategory?.map((tc) => ({
        id: tc.category?.id,
        name: tc.category?.categoryName,
        code: tc.category?.trainingCode,
      })) || [];

    // 🔹 Map participants
    const participants =
      result.trainingParticipant?.map((tp) => ({
        id: tp.participant?.id,
        name: `${tp.participant?.firstName ?? ""} ${tp.participant?.lastName ?? ""}`.trim(),
        email: tp.participant?.email,
        company: tp.participant?.company,
        status: tp.status,
      })) || [];

    // 🔹 Bentuk final response
    const trainingDetail = {
      id: result.id,
      trainingName: result.trainingName,
      price: result.price,
      startDateTraining: result.startDateTraining,
      endDateTraining: result.endDateTraining,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      coach: result.trainingCoach
        ? {
            id: result.trainingCoach.id,
            name: result.trainingCoach.coachName,
          }
        : null,
      categories,
      totalParticipants: participants.length,
      participants,
    };

    return res.status(200).send(
      successResponse(
        "Get Training by ID Success",
        { data: trainingDetail },
        200
      )
    );
  } catch (error) {
    return res.status(500).send(
      errorResponse(
        error instanceof Error ? error.message : "Unknown error occurred",
        500
      )
    );
  }
};





export const createTraining = async (req: Request, res: Response) => {
  // ✅ Validasi input sesuai kebutuhan model
  const createTrainingSchema = Joi.object({
    trainingName: Joi.string().required(),
    categoryId: Joi.string().required(), // relasi melalui ID kategori
    coachId: Joi.string().required(),
    price: Joi.number().min(0).required(),
    startDateTraining: Joi.date().required(),
    endDateTraining: Joi.date().required(),
    ttdImage: Joi.string().required(),
    signatoryPosition: Joi.string().required(),
    signatoryName: Joi.string().required(),
  });

  try {
    const { error, value } = createTrainingSchema.validate(req.body);
    if (error) {
      return res.status(422).send(validationResponse(error));
    }

    const {
      trainingName,
      categoryId,
      coachId,
      price,
      startDateTraining,
      endDateTraining,
      ttdImage,
      signatoryPosition,
      signatoryName,
    } = value;

    // 🔹 Validasi Coach
    const findCoach = await coachRepository.findOne({ where: { id: coachId } });
    if (!findCoach) {
      return res.status(404).send(errorResponse("Coach not found", 404));
    }

    // 🔹 Validasi Category
    const findCategory = await categoryRepository.findOne({ where: { id: categoryId } });
    if (!findCategory) {
      return res.status(404).send(errorResponse("Category not found", 404));
    }

    // 🔹 Buat Training Baru
    const newTraining = trainingRepository.create({
      trainingName,
      category: findCategory.categoryName, // tetap isi nama kategori di field `category`
      price,
      startDateTraining,
      endDateTraining,
      ttdImage,
      signatoryPosition,
      signatoryName,
      trainingCoach: findCoach,
    });

    await trainingRepository.save(newTraining);

    // 🔹 Buat Relasi ke Category di table `trainingCategory`
    const newTrainingCategory = trainingCategoryRepository.create({
      category: findCategory,
      training: newTraining,
    });
    await trainingCategoryRepository.save(newTrainingCategory);

    return res.status(201).send(
      successResponse(
        "Training created successfully",
        { data: newTraining },
        201
      )
    );
  } catch (error) {
    console.error("❌ Error creating training:", error);
    return res.status(500).send(
      errorResponse(
        error instanceof Error ? error.message : "Unknown error occurred",
        500
      )
    );
  }
};



export const updateTraining = async (req: Request, res: Response) => {
  // ✅ Validasi input (tanpa category di body, karena hanya update link category di trainingCategory)
  const updateTrainingSchema = (input: any) =>
    Joi.object({
      trainingName: Joi.string().optional(),
      price: Joi.number().min(0).optional(),
      coachId: Joi.string().optional(),
      startDateTraining: Joi.date().optional(),
      endDateTraining: Joi.date().optional(),
      signatoryName: Joi.string().optional(),
      signatoryPosition: Joi.string().optional(),
      ttdImage: Joi.string().optional(),
      categoryId: Joi.string().optional(), // 🔹 kategori baru (kalau trainingCategory mau diganti)
    }).validate(input);

  try {
    const { id } = req.params; // trainingId
    const body = req.body;
    const schema = updateTrainingSchema(body);

    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // 🔍 Cari data training yang mau diupdate
    const existingTraining = await trainingRepository.findOne({
      where: { id },
      relations: ["trainingCoach", "trainingCategory"],
    });

    if (!existingTraining) {
      return res.status(404).json({ msg: "Training not found" });
    }

    // 🔹 Update coach jika diberikan
    if (body.coachId) {
      const coach = await coachRepository.findOneBy({ id: body.coachId });
      if (!coach) {
        return res.status(404).json({ msg: "Coach not found" });
      }
      existingTraining.trainingCoach = coach;
    }

    // ✏️ Update properti dasar
    if (body.trainingName) existingTraining.trainingName = body.trainingName;
    if (body.price !== undefined) existingTraining.price = body.price;
    if (body.startDateTraining) existingTraining.startDateTraining = new Date(body.startDateTraining);
    if (body.endDateTraining) existingTraining.endDateTraining = new Date(body.endDateTraining);
    if (body.signatoryName) existingTraining.signatoryName = body.signatoryName;
    if (body.signatoryPosition) existingTraining.signatoryPosition = body.signatoryPosition;
    if (body.ttdImage) existingTraining.ttdImage = body.ttdImage;

    // 💾 Simpan perubahan training
    await trainingRepository.save(existingTraining);

    // 🔄 Update trainingCategory yang punya training.id sama
    const existingTrainingCategory = await trainingCategoryRepository.findOne({
      where: { training: { id } },
      relations: ["category", "training"],
    });

    if (existingTrainingCategory) {
      // Kalau user kirim categoryId baru → ubah relasi category-nya
      if (body.categoryId) {
        existingTrainingCategory.category = { id: body.categoryId } as any;
      }

      // Update tanggal juga (kalau di training berubah)
      if (body.startDateTraining)
        existingTrainingCategory.training.startDateTraining = new Date(body.startDateTraining);
      if (body.endDateTraining)
        existingTrainingCategory.training.endDateTraining = new Date(body.endDateTraining);

      await trainingCategoryRepository.save(existingTrainingCategory);
    }

    return res.status(200).send(
      successResponse(
        "Update Training and Training Category Success",
        { data: existingTraining },
        200
      )
    );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};



export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trainingToDelete = await trainingRepository.findOne({
      where: { id },
      relations: ["trainingCategory"],
    });

    if (!trainingToDelete) {
      return res.status(404).json({ msg: "Training not Found" });
    }

    // Soft delete semua relasi trainingCategory
    if (trainingToDelete.trainingCategory?.length > 0) {
      await trainingCategoryRepository.softRemove(trainingToDelete.trainingCategory);
    }

    // Soft delete training utama
    await trainingRepository.softRemove(trainingToDelete);

    return res
      .status(200)
      .send(
        successResponse(
          "Training soft-deleted successfully (including related categories)",
          { data: trainingToDelete },
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

