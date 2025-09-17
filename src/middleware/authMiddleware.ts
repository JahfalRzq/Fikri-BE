import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types/JwtPayload'
const { successResponse, errorResponse, validationResponse } = require('../utils/response')
import { user } from '../model/user'
import { AppDataSource } from "../data-source";
import {  UserRole } from "../model/user";

const userRepository = AppDataSource.getRepository(user)

export const authMiddleware = async (request: Request, response: Response, next: NextFunction) => {
  const authHeader = await request.get('Authorization')

  if (!authHeader) {
    return response.status(409).send(errorResponse('Authorization header not provided', 409))
  }

  const token = authHeader.split(' ')[1]

  try {
    const jwtPayload = await jwt.verify(token, process.env.JWT_SECRET)
    request.jwtPayload = jwtPayload as JwtPayload
    return next()
  } catch (err) {
    return response.status(401).send(errorResponse('JWT Error', 401))
  }
}

export const onlyAdminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.jwtPayload || !req.jwtPayload.id) {
      return res.status(401).send(errorResponse("Unauthorized: JWT payload not found", 401));
    }

    const userAccess = await userRepository.findOneBy({ id: req.jwtPayload.id });

    if (!userAccess) {
      return res.status(404).send(errorResponse("User not found", 404));
    }

    if (userAccess.role !== UserRole.ADMIN) {
      return res.status(403).send(errorResponse("Access Denied: Only ADMIN can access this resource", 403));
    }

    // If user is admin, proceed to next middleware/controller
    next();
  } catch (error) {
    return res.status(500).send(errorResponse("Internal server error", 500));
  }
};