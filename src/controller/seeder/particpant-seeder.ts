import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { participant } from "@/model/participant";
import { user, UserRole } from "@/model/user";
import { training } from "@/model/training";
import { errorResponse, successResponse } from "@/utils/response";

const participantRepository = AppDataSource.getRepository(participant);
const userRepository = AppDataSource.getRepository(user);
const trainingRepository = AppDataSource.getRepository(training);

export const participantSeeder = async (req: Request, res: Response) => {
  // try {
  //   const trainings = await trainingRepository.find();
  //   if (trainings.length === 0) {
  //     return res.status(404).send(errorResponse("No training found, seed training first", 404));
  //   }

  //   const participantsSeed = [
  //     {
  //       email: "alice@example.com",
  //       firstName: "Alice",
  //       lastName: "Anderson",
  //       company: "Tech Corp",
  //       companyAddress: "Jl. Merdeka No. 123",
  //       phone: "081234567890",       // ubah jadi string
  //       jobTitle: "Software Engineer",
  //       officePhone: "02134567",     // ubah jadi string
  //       message: "Excited to join this training!",
  //       training: trainings[0].id,
  //     },
  //     {
  //       email: "bob@example.com",
  //       firstName: "Bob",
  //       lastName: "Brown",
  //       company: "Creative Studio",
  //       companyAddress: "Jl. Sudirman No. 456",
  //       phone: "081298765432",
  //       jobTitle: "Graphic Designer",
  //       officePhone: "02145678",
  //       message: "Looking forward to learning!",
  //       training: trainings[0].id,
  //     },
  //   ];

  //   for (const data of participantsSeed) {
  //     const trainingType = await trainingRepository.findOneBy({ id: data.training });
  //     if (!trainingType) {
  //       console.warn(`Training ${data.training} not found, skipping participant ${data.email}`);
  //       continue;
  //     }

  //     const newParticipant = new participant();
  //     newParticipant.email = data.email;
  //     newParticipant.firstName = data.firstName;
  //     newParticipant.lastName = data.lastName;
  //     newParticipant.company = data.company;
  //     newParticipant.companyAddress = data.companyAddress;
  //     newParticipant.phone = data.phone; // sudah string
  //     newParticipant.jobTitle = data.jobTitle;
  //     newParticipant.officePhone = data.officePhone; // sudah string
  //     newParticipant.message = data.message;

  //     await participantRepository.save(newParticipant);

  //     const newUser = new user();
  //     newUser.userName = newParticipant.firstName;
  //     newUser.password = newParticipant.firstName + "123)(*";
  //     newUser.hashPassword();
  //     newUser.role = UserRole.PARTICIPANT;
  //     newUser.participantId = newParticipant;

  //     await userRepository.save(newUser);
  //   }

  //   console.info("Participants seeded successfully.");
  //   return res.status(201).send(successResponse("Participants seeded successfully", null, 201));
  // } catch (error) {
  //   return res
  //     .status(500)
  //     .send(
  //       errorResponse(
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //         500,
  //       ),
  //     );
  // }
};
