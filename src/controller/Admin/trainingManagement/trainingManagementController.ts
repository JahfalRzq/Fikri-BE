import { Request, Response } from "express";
import { AppDataSource } from "../../../data-source";
import { user, UserRole } from "../../../model/user";
import Joi from "joi";
import { training } from "../../../model/training";


const trainingRepository = AppDataSource.getRepository(training);
const userRepository = AppDataSource.getRepository(user);

const { successResponse, errorResponse, validationResponse } = require('../../../utils/response');




export const getAllTraining = async (req: Request, res: Response) => {
  try {
    const { trainingName, category, trainingCode, startDateTraining, endDateTraining } = req.query;

    const query = trainingRepository
      .createQueryBuilder("training")
      .orderBy("training.createdAt", "DESC");

    if (trainingName) {
      query.andWhere("product.trainingName LIKE :name", {
        name: `%${trainingName}%`,
      });
    }

    if (category) {
      query.andWhere("product.category LIKE :name", {
        categoryProduct: `%${category}%`,
      });
    }

    if (trainingCode) {
      query.andWhere("product.trainingCode LIKE :name", {
        trainingCodeProduct: `%${trainingCode}%`,
      });
    }

    if (startDateTraining) {
      query.andWhere("product.startDateTraining LIKE :name", {
        startDateTrainingProduct: `%${startDateTraining}%`,
      });
    }

    if (endDateTraining) {
      query.andWhere("product.endDateTraining LIKE :name", {
        endDateTrainingProduct: `%${endDateTraining}%`,
      });
    }



    const result = await query.getMany();
    return res.status(200).send(successResponse("Get Training Success", { data: result }, 200));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTrainingtById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await trainingRepository.findOneBy({ id });
    if (!result) return res.status(404).json({ msg: "Training Not Found" });
    return res.status(200).send(successResponse("Get Training by ID Success", { data: result }, 200));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const createTraining = async (req: Request, res: Response) => {
  const createTrainingSchema = (input) => Joi.object({
    trainingName: Joi.string().required(),
    category: Joi.string().required(),
    trainingCode: Joi.string().required(),
    coach: Joi.string().required(),
    price: Joi.number().min(0).required(),
    startDateTraining: Joi.date().required(),
    endDateTraining: Joi.date().required(),
  }).validate(input);
  try {
    const body = req.body;
    const schema = createTrainingSchema(req.body)
    if ('error' in schema) {
      return res.status(422).send(validationResponse(schema))
    }


    const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
    if (!userAccess || userAccess.role !== UserRole.ADMIN) {
      return res.status(403).send(errorResponse("Access Denied: Only ADMIN can create product", 403));
    }
    const newTraining = new training();
    newTraining.trainingName = body.trainingName;
    newTraining.category = body.category;
    newTraining.trainingCode = body.trainingCode;
    newTraining.coach = body.coach;
    newTraining.price = body.price;
    newTraining.startDateTraining = body.startDateTraining;
    newTraining.endDateTraining = body.endDateTraining;
    await trainingRepository.save(newTraining);



    return res.status(201).send(successResponse("Training created successfully", { data: newTraining }, 201));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateTraining = async (req: Request, res: Response) => {
  const updateTrainingSchema = (input) => Joi.object({
    trainingName: Joi.string().optional(),
    category: Joi.string().optional(),
    trainingCode: Joi.string().optional(),
    coach: Joi.string().optional(),
    price: Joi.number().min(0).optional(),
    startDateTraining: Joi.date().optional(),
    endDateTraining: Joi.date().optional(),
  }).validate(input);
  try {
    const { id } = req.params;
    const body = req.body;
    const schema = updateTrainingSchema(req.body)

    if ('error' in schema) {
      return res.status(422).send(validationResponse(schema))
    }


    const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
    if (!userAccess || userAccess.role !== UserRole.ADMIN) {
      return res.status(403).send(errorResponse("Access Denied: Only ADMIN can update training", 403));
    }

    const updateTraining = await trainingRepository.findOneBy({ id });
    if (!updateTraining) {
      return res.status(404).json({ msg: "Training Not Found" });
    }

    updateTraining.trainingName = body.trainingName;
    updateTraining.category = body.category;
    updateTraining.trainingCode = body.trainingCode;
    updateTraining.coach = body.coach;
    updateTraining.price = body.price;
    updateTraining.startDateTraining = body.startDateTraining;
    updateTraining.endDateTraining = body.endDateTraining;


    await trainingRepository.save(updateTraining);

    return res.status(200).send(successResponse("Update Training Success", { data: updateTraining }, 200));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteTraining = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });
    if (!userAccess || userAccess.role !== UserRole.ADMIN) {
      return res.status(403).send(errorResponse("Access Denied: Only ADMIN can delete Training", 403));
    }

    const trainingToDelete = await trainingRepository.findOneBy({ id });
    if (!trainingToDelete) {
      return res.status(404).json({ msg: "Training not Found" });
    }

    // Hapus permanen dari database
    await trainingRepository.remove(trainingToDelete);

    return res.status(200).send(successResponse("Training permanently deleted", { data: trainingToDelete }, 200));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
