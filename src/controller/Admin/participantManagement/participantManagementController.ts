import { Request, Response } from "express";
import { AppDataSource } from "../../../data-source";
import { user, UserRole } from "../../../model/user";
import Joi from "joi";
import { training } from "../../../model/training";
import { participant, statusTraining } from "../../../model/participant";

const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);
const participantRepository = AppDataSource.getRepository(participant);


const { successResponse, errorResponse, validationResponse } = require('../../../utils/response');




export const getAllParticipant = async (req: Request, res: Response) => {
    try {
        const { firstName, company, trainingCode, startDateTraining, endDateTraining } = req.query;

        const query = participantRepository
            .createQueryBuilder("participant")
            .orderBy("participant.createdAt", "DESC");

        if (firstName) {
            query.andWhere("product.firstName LIKE :name", {
                name: `%${firstName}%`,
            });
        }

        if (company) {
            query.andWhere("product.company LIKE :name", {
                companyProduct: `%${company}%`,
            });
        }

        const result = await query.getMany();
        return res.status(200).send(successResponse("Get Participant Success", { data: result }, 200));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getParticipanttById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const result = await participantRepository.findOneBy({ id });
        if (!result) return res.status(404).json({ msg: "Participant Not Found" });
        return res.status(200).send(successResponse("Get Participant by ID Success", { data: result }, 200));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createParticipant = async (req: Request, res: Response) => {
    const createParticipantSchema = (input) => Joi.object({
        email: Joi.string().email().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        company: Joi.string().required(),
        companyAddress: Joi.string().required(),
        phone: Joi.number().min(0).required(),
        jobTitle: Joi.string().required(),
        officePhone: Joi.number().min(0).required(),
        message: Joi.string().required(),
    }).validate(input);
    try {
        const body = req.body;
        const schema = createParticipantSchema(req.body)
        if ('error' in schema) {
            return res.status(422).send(validationResponse(schema))
        }


        const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
        if (!userAccess || userAccess.role !== UserRole.ADMIN) {
            return res.status(403).send(errorResponse("Access Denied: Only ADMIN can create product", 403));
        }

        const id = req.params.id;
        const trainingType = await trainingRepository.findOneBy({ id })

        const newParticipant = new participant();
        newParticipant.email = body.email
        newParticipant.firstName = body.firstName;
        newParticipant.lastName = body.lastName;
        newParticipant.company = body.company;
        newParticipant.companyAddress = body.companyAddress;
        newParticipant.phone = body.phone;
        newParticipant.jobTitle = body.jobTitle;
        newParticipant.officePhone = body.officePhone;
        newParticipant.message = body.message;
        newParticipant.status = statusTraining.belumMulai;
        newParticipant.training = trainingType
        await participantRepository.save(newParticipant);

        const participantId = await participantRepository.findOneBy({ id: newParticipant.id })


        const newUser = new user();
        newUser.email = newParticipant.email
        newUser.userName = newParticipant.firstName
        newUser.phone = newParticipant.phone
        newUser.password = newParticipant.firstName + `${'123)(*'}`
        newUser.hashPassword()
        newUser.role = UserRole.PARTICIPANT
        newUser.participantId = participantId
        await userRepository.save(newUser)

        const userParticipant = await userRepository.findOneBy({ id: newUser.id })

        newParticipant.user = userParticipant
        await participantRepository.save(newParticipant)



        return res.status(201).send(successResponse("Participant created successfully", { data: newParticipant }, 201));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


export const updateParticipant = async (req: Request, res: Response) => {
    const updateParticipantSchema = (input) => Joi.object({
        email: Joi.string().email().optional(),
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        company: Joi.string().optional(),
        companyAddress: Joi.string().optional(),
        phone: Joi.number().min(0).optional(),
        jobTitle: Joi.string().optional(),
        officePhone: Joi.number().min(0).optional(),
        message: Joi.string().optional(),
        status: Joi.string().valid(...Object.values(statusTraining)).optional(),
    }).validate(input);

    try {
        const { id } = req.params;
        const body = req.body;
        const schema = updateParticipantSchema(req.body);

        if ('error' in schema) {
            return res.status(422).send(validationResponse(schema));
        }

        const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
        if (!userAccess || userAccess.role !== UserRole.ADMIN) {
            return res.status(403).send(errorResponse("Access Denied: Only ADMIN can update participant", 403));
        }

        const existingParticipant = await participantRepository.findOneBy({ id });
        if (!existingParticipant) {
            return res.status(404).json({ msg: "Participant Not Found" });
        }

        // Update participant details
        existingParticipant.email = body.email;
        existingParticipant.firstName = body.firstName;
        existingParticipant.lastName = body.lastName;
        existingParticipant.company = body.company;
        existingParticipant.companyAddress = body.companyAddress;
        existingParticipant.phone = body.phone;
        existingParticipant.jobTitle = body.jobTitle;
        existingParticipant.officePhone = body.officePhone;
        existingParticipant.message = body.message;
        existingParticipant.status = body.status;

        await participantRepository.save(existingParticipant);

        // Update user details associated with the participant
        const userParticipant = await userRepository.findOneBy({ participantId: { id: existingParticipant.id } });
        userParticipant.email = existingParticipant.email
        userParticipant.userName = existingParticipant.firstName
        userParticipant.phone = existingParticipant.phone
        userParticipant.hashPassword()
        userParticipant.role = UserRole.PARTICIPANT
        await userRepository.save(userParticipant);


        return res.status(200).send(successResponse("Update Participant Success", { existingParticipant }, 200));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteParticipant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
        if (!userAccess || userAccess.role !== UserRole.ADMIN) {
            return res.status(403).send(errorResponse("Access Denied: Only ADMIN can delete participant", 403));
        }

        const participantToDelete = await participantRepository.findOneBy({ id });
        if (!participantToDelete) {
            return res.status(404).json({ msg: "Participant not Found" });
        }

        // Hapus pengguna yang terkait dengan peserta
        const userParticipant = await userRepository.findOneBy({ participantId: { id: participantToDelete.id } });
        if (userParticipant) {
            await userRepository.remove(userParticipant);
        }

        // Hapus peserta dari database
        await participantRepository.remove(participantToDelete);

        return res.status(200).send(successResponse("Participant permanently deleted", { data: participantToDelete }, 200));
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};