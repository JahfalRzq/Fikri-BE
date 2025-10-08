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
      userName: Joi.string().optional(),
      password: Joi.string().min(6).optional(),
      imageAvatar: Joi.string().optional(), // base64 atau URL
    }).validate(input);

  try {
    // Pastikan user login (dari JWT)
    if (!req.jwtPayload) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // Validasi input
    const schema = updateAdminSchema(req.body);
    if ("error" in schema) {
      return res.status(422).send(validationResponse(schema));
    }

    // Ambil user berdasarkan token
    const adminUser = await userRepository.findOneBy({ id: req.jwtPayload.id });
    if (!adminUser) {
      return res.status(404).json({ msg: "Admin not found" });
    }

    if (adminUser.role !== UserRole.ADMIN) {
      return res.status(403).json({ msg: "Access Denied: Not an Admin" });
    }

    const { userName, password, imageAvatar } = req.body;

    // Update hanya field yang dikirim
    if (userName) adminUser.userName = userName;
    if (imageAvatar) adminUser.imageAvatar = imageAvatar;

    // Jika ada password baru → hash ulang
    if (password) {
      adminUser.password = password;
      adminUser.hashPassword();
    }

    await userRepository.save(adminUser);

    // Hilangkan password sebelum dikirim ke FE
    const { password: _, ...safeUser } = adminUser;

    return res
      .status(200)
      .send(
        successResponse(
          "Update Admin Profile Success",
          { admin: safeUser },
          200
        )
      );
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

    // Ambil user login dari token
    const userAccess = await userRepository.findOne({
      where: { id: req.jwtPayload.id },
      relations: ["participants"],
    });

    if (!userAccess || userAccess.role !== UserRole.PARTICIPANT) {
      return res.status(403).json({ msg: "Access Denied" });
    }

    // Ambil entity participant dari relasi
    const participantEntity = userAccess.participants[0];
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

    // Update field participant
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

    // Update user terkait (nama + password)
    if (firstName) userAccess.userName = firstName;

    if (password) {
      userAccess.password = password;
      userAccess.hashPassword();
    }

    await userRepository.save(userAccess);

    // hapus password dari response
    const { password: _, ...safeUser } = userAccess;

    return res
      .status(200)
      .send(
        successResponse(
          "Update Participant Profile Success",
          {
            participant: participantEntity,
            user: safeUser,
          },
          200,
        ),
      );
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};