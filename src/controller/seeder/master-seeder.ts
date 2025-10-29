import { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { category } from "@/model/category";
import { coach } from "@/model/coach";
import { training } from "@/model/training";
import { user, UserRole } from "@/model/user";
import { participant } from "@/model/participant";
import { trainingParticipant, statusTraining } from "@/model/training-participant";
import { trainingCategory } from "@/model/training-category";
import { trainingParticipantCategory } from "@/model/training-participant-category";
import { certificate } from "@/model/certificate";
import { successResponse, errorResponse } from "@/utils/response";

export const masterSeeder = async (req: Request, res: Response) => {
  const categoryRepo = AppDataSource.getRepository(category);
  const coachRepo = AppDataSource.getRepository(coach);
  const trainingRepo = AppDataSource.getRepository(training);
  const userRepo = AppDataSource.getRepository(user);
  const participantRepo = AppDataSource.getRepository(participant);
  const trainingParticipantRepo = AppDataSource.getRepository(trainingParticipant);
  const trainingCategoryRepo = AppDataSource.getRepository(trainingCategory);
  const trainingParticipantCategoryRepo = AppDataSource.getRepository(trainingParticipantCategory);
  const certificateRepo = AppDataSource.getRepository(certificate);

  try {
    // 🟢 1. Category
    const categories = categoryRepo.create([
      { categoryName: "Business Management", trainingCode: "BM-001" },
      { categoryName: "Programming", trainingCode: "PRG-002" },
      { categoryName: "Digital Marketing", trainingCode: "DM-003" },
    ]);
    await categoryRepo.save(categories);

    // 🟢 2. Coach
    const coaches = coachRepo.create([
      { coachName: "John Doe" },
      { coachName: "Jane Smith" },
      { coachName: "Michael Johnson" },
    ]);
    await coachRepo.save(coaches);

    // 🟢 3. User
    const users = userRepo.create([
      { userName: "Admin1", password: "Admin1!0)", role: UserRole.ADMIN },
      { userName: "participant01", password: "Participant1!0)", role: UserRole.PARTICIPANT },
      { userName: "participant02", password: "Participant2@9(", role: UserRole.PARTICIPANT },
    ]);

    users.forEach((u) => u.hashPassword());
    await userRepo.save(users);

    // 🟢 4. Training
    const trainings = trainingRepo.create([
      {
        trainingName: "Leadership Essentials",
        category: "Business",
        price: 2500000,
        startDateTraining: new Date("2025-10-01"),
        endDateTraining: new Date("2025-10-05"),
        ttdImage: "signature1.png",
        signatoryPosition: "Director",
        signatoryName: "Mr. A",
        trainingCoach: coaches[0],
      },
      {
        trainingName: "Advanced JavaScript",
        category: "Programming",
        price: 3000000,
        startDateTraining: new Date("2025-11-10"),
        endDateTraining: new Date("2025-11-15"),
        ttdImage: "signature2.png",
        signatoryPosition: "Tech Lead",
        signatoryName: "Ms. B",
        trainingCoach: coaches[1],
      },
    ]);
    await trainingRepo.save(trainings);

    // 🟢 5. TrainingCategory (relasi training <-> category)
    const trainingCategories = trainingCategoryRepo.create([
      { category: categories[0], training: trainings[0] },
      { category: categories[1], training: trainings[1] },
    ]);
    await trainingCategoryRepo.save(trainingCategories);

    // 🟢 6. Participant
    const participants = participantRepo.create([
      {
        email: "john@example.com",
        firstName: "John",
        lastName: "Doe",
        company: "PT. Maju Jaya",
        companyAddress: "Jl. Sudirman No.10",
        phone: "08123456789",
        jobTitle: "Manager",
        officePhone: "021987654",
        message: "Ready to learn leadership",
        user: users[1],
      },
      {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Smith",
        company: "PT. Inovasi",
        companyAddress: "Jl. Thamrin No.20",
        phone: "082233445566",
        jobTitle: "Developer",
        officePhone: "021123456",
        message: "Excited to join JS training",
        user: users[2],
      },
    ]);
    await participantRepo.save(participants);

    // 🟢 7. TrainingParticipant (relasi peserta <-> pelatihan)
    const trainingParticipants = trainingParticipantRepo.create([
      {
        status: statusTraining.selesai,
        ttdImage: "sign1.png",
        signatoryPosition: "Director",
        signatoryName: "Mr. A",
        startDateTraining: new Date("2025-10-01"),
        endDateTraining: new Date("2025-10-05"),
        participant: participants[0],
        training: trainings[0],
        coach: coaches[0],
      },
      {
        status: statusTraining.sedangBerlangsung,
        ttdImage: "sign2.png",
        signatoryPosition: "Tech Lead",
        signatoryName: "Ms. B",
        startDateTraining: new Date("2025-11-10"),
        endDateTraining: new Date("2025-11-15"),
        participant: participants[1],
        training: trainings[1],
        coach: coaches[1],
      },
    ]);
    await trainingParticipantRepo.save(trainingParticipants);

    // 🟢 8. TrainingParticipantCategory (kategori untuk relasi training-participant)
    const trainingParticipantCategories = trainingParticipantCategoryRepo.create([
      { category: categories[0], trainingParticipant: [trainingParticipants[0]] },
      { category: categories[1], trainingParticipant: [trainingParticipants[1]] },
    ]);
    await trainingParticipantCategoryRepo.save(trainingParticipantCategories);

    // 🟢 9. Certificate
    const certificates = certificateRepo.create([
      {
        imageUrl: "cert1.png",
        noLiscense: "CERT-001",
        expiredAt: new Date("2026-10-01"),
        trainingParticipant: trainingParticipants[0],
      },
      {
        imageUrl: "cert2.png",
        noLiscense: "CERT-002",
        expiredAt: new Date("2026-11-10"),
        trainingParticipant: trainingParticipants[1],
      },
    ]);
    await certificateRepo.save(certificates);

    return res
      .status(201)
      .send(successResponse("✅ Master seeder executed successfully!", null, 201));
  } catch (error: any) {
    return res
      .status(500)
      .send(errorResponse(error.message || "Seeder failed", 500));
  }
};
