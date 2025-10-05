import type { Request, Response } from "express";
import { AppDataSource } from "@/data-source";
import { user, UserRole } from "@/model/user";
import { participant } from "@/model/participant";
import Joi from "joi";
import {
  successResponse,
  validationResponse,
} from "@/utils/response";

const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);


export const updateAdminProfile = async (req: Request, res: Response) => {
  const updateAdminSchema = (input: any) =>
    Joi.object({
      email: Joi.string().email().optional(),
      userName: Joi.string().optional(),
      phone: Joi.string().optional(),
      password: Joi.string().min(6).optional(),
    }).validate(input);

  try {
    if (!req.jwtPayload) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const schema = updateAdminSchema(req.body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const adminUser = await userRepository.findOneBy({ id: req.jwtPayload.id });
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ msg: "Access Denied" });
    }

    const { email, userName, phone, password } = req.body;

    adminUser.userName = userName ?? adminUser.userName;

    if (password) {
      adminUser.password = password;
      adminUser.hashPassword();
    }

    await userRepository.save(adminUser);

    return res
      .status(200)
      .send(successResponse("Update Admin Profile Success", { adminUser }, 200));
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};


export const updateParticipantProfile = async (req: Request, res: Response) => {
  const updateParticipantSchema = (input: any) =>
    Joi.object({
      email: Joi.string().email().optional(),
      firstName: Joi.string().optional(),
      lastName: Joi.string().optional(),
      company: Joi.string().optional(),
      companyAddress: Joi.string().optional(),
      phone: Joi.string().optional(),
      jobTitle: Joi.string().optional(),
      officePhone: Joi.string().optional(),
      message: Joi.string().optional(),
      password: Joi.string().min(6).optional(),
    }).validate(input);

  try {
    if (!req.jwtPayload) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    const schema = updateParticipantSchema(req.body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    const userAccess = await userRepository.findOne({
      where: { id: req.jwtPayload.id },
      relations: ["participantId"],
    });

    if (!userAccess || userAccess.role !== UserRole.PARTICIPANT) {
      return res.status(403).json({ msg: "Access Denied" });
    }

    const participantEntity = userAccess.participantId;
    if (!participantEntity) {
      return res.status(404).json({ msg: "Participant Not Found" });
    }

    const {
      email,
      firstName,
      lastName,
      company,
      companyAddress,
      phone,
      jobTitle,
      officePhone,
      message,
      password,
    } = req.body;

    // Update participant
    participantEntity.email = email ?? participantEntity.email;
    participantEntity.firstName = firstName ?? participantEntity.firstName;
    participantEntity.lastName = lastName ?? participantEntity.lastName;
    participantEntity.company = company ?? participantEntity.company;
    participantEntity.companyAddress =
      companyAddress ?? participantEntity.companyAddress;
    participantEntity.phone = phone ?? participantEntity.phone;
    participantEntity.jobTitle = jobTitle ?? participantEntity.jobTitle;
    participantEntity.officePhone = officePhone ?? participantEntity.officePhone;
    participantEntity.message = message ?? participantEntity.message;

    await participantRepository.save(participantEntity);

    // Update user linked to participant
    userAccess.userName = participantEntity.firstName;

    if (password) {
      userAccess.password = password;
      userAccess.hashPassword();
    }

    await userRepository.save(userAccess);

    return res
      .status(200)
      .send(
        successResponse(
          "Update Participant Profile Success",
          { participant: participantEntity, user: userAccess },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};