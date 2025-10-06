import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { training } from "@/model/training";
import { errorResponse, successResponse } from "@/utils/response";

const trainingRepository = AppDataSource.getRepository(training);

export const trainingSeeder = async (req: Request, res: Response) => {
  const trainingSeed = [
    {
      trainingName: "Leadership Essentials",
      category: "Business & Management",
      // trainingCode: "TRN-001",
      // coach: "John Doe",
      price: 2500000,
      startDateTraining: new Date("2025-10-01"),
      endDateTraining: new Date("2025-10-05"),
    },
    {
      trainingName: "Advanced JavaScript",
      category: "IT & Programming",
      // trainingCode: "TRN-002",
      // coach: "Jane Smith",
      price: 3000000,
      startDateTraining: new Date("2025-11-10"),
      endDateTraining: new Date("2025-11-15"),
    },
    {
      trainingName: "Digital Marketing Mastery",
      category: "Digital Marketing",
      trainingCode: "TRN-003",
      coach: "Michael Johnson",
      price: 2000000,
      startDateTraining: new Date("2025-12-01"),
      endDateTraining: new Date("2025-12-03"),
    },
  ];

  // try {
  //   for (const data of trainingSeed) {
  //     const newTraining = trainingRepository.create({
  //       trainingName: data.trainingName,
  //       category: data.category,
  //       // trainingCode: data.trainingCode,
  //       // coach: data.coach,
  //       price: data.price,
  //       startDateTraining: data.startDateTraining,
  //       endDateTraining: data.endDateTraining,
  //     });

  //     await trainingRepository.save(newTraining);
  //   }

  //   console.info("Training seeded successfully.");
  //   return res
  //     .status(201)
  //     .send(successResponse("Training seeded successfully", null, 201));
  // } catch (error) {
  //   return res
  //     .status(400)
  //     .send(
  //       errorResponse(
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //         400,
  //       ),
  //     );
  // }
};

