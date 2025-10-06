import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { training } from "@/model/training";
import { category } from "@/model/category";
import { trainingCategory } from "@/model/training-category";
import { coach } from "@/model/coach";
import { successResponse, errorResponse } from "@/utils/response";

const trainingRepo = AppDataSource.getRepository(training);
const categoryRepo = AppDataSource.getRepository(category);
const trainingCategoryRepo = AppDataSource.getRepository(trainingCategory);
const coachRepo = AppDataSource.getRepository(coach);

export const trainingSeeder = async (req: Request, res: Response) => {
  const seedData = [
    {
      trainingName: "Leadership Essentials",
      categoryName: "Business & Management",
      trainingCode: "TRN-001",
      coachName: "John Doe",
      price: 2500000,
      startDateTraining: new Date("2025-10-01"),
      endDateTraining: new Date("2025-10-05"),
    },
    {
      trainingName: "Advanced JavaScript",
      categoryName: "IT & Programming",
      trainingCode: "TRN-002",
      coachName: "Jane Smith",
      price: 3000000,
      startDateTraining: new Date("2025-11-10"),
      endDateTraining: new Date("2025-11-15"),
    },
    {
      trainingName: "Digital Marketing Mastery",
      categoryName: "Digital Marketing",
      trainingCode: "TRN-003",
      coachName: "Michael Johnson",
      price: 2000000,
      startDateTraining: new Date("2025-12-01"),
      endDateTraining: new Date("2025-12-03"),
    },
  ];

  try {
    for (const data of seedData) {
      // 🔹 Cari atau buat kategori
      let cat = await categoryRepo.findOne({ where: { categoryName: data.categoryName } });
      if (!cat) {
        cat = categoryRepo.create({
          categoryName: data.categoryName,
          trainingCode: data.trainingCode,
        });
        await categoryRepo.save(cat);
      }

      // 🔹 Cari atau buat coach
      let trCoach = await coachRepo.findOne({ where: { coachName: data.coachName } });
      if (!trCoach) {
        trCoach = coachRepo.create({ coachName: data.coachName });
        await coachRepo.save(trCoach);
      }

      // 🔹 Buat training
      const newTraining = trainingRepo.create({
        trainingName: data.trainingName,
        category: data.categoryName,
        price: data.price,
        startDateTraining: data.startDateTraining,
        endDateTraining: data.endDateTraining,
        signatoryName: "Admin Pelatihan",
        signatoryPosition: "Direktur",
        ttdImage: "https://example.com/signature.png",
        trainingCoach: trCoach,
      });

      const savedTraining = await trainingRepo.save(newTraining);

      // 🔹 Hubungkan training ↔ category
      const trainingCat = trainingCategoryRepo.create({
        training: savedTraining,
        category: cat,
      });

      await trainingCategoryRepo.save(trainingCat);
    }

    console.log("✅ Training seeder success");
    return res.status(201).send(successResponse("Training seeded successfully", null, 201));
  } catch (error) {
    console.error("Seeder error:", error);
    return res
      .status(400)
      .send(errorResponse(error instanceof Error ? error.message : "Unknown error occurred", 400));
  }
};
