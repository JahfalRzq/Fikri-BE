import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/types/jwt-payload";
import { errorResponse } from "@/utils/response";
import { user } from "@/model/user";
import { AppDataSource } from "@/data-source";
import { UserRole } from "@/model/user";
import dotenv from "dotenv";

dotenv.config();

const userRepository = AppDataSource.getRepository(user);

export const authMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const authHeader = request.get("Authorization");

  // 1. Cek jika header ada
    console.log("--- AUTH MIDDLEWARE START ---");
    console.log("Header:", authHeader);

  if (!authHeader) {
    return response
      .status(409)
      .send(errorResponse("Authorization header not provided", 409));
  }

  const token = authHeader.split(" ")[1];
  console.log("Token:", token);

  try {
    const jwtPayload = jwt.verify(token, process.env.JWT_SECRET!);
    request.jwtPayload = jwtPayload as JwtPayload;
    return next();
  } catch (_err) {
    return response.status(401).send(errorResponse("JWT Error", 401));
  }
};

export const onlyAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.jwtPayload?.id) {
      return res
        .status(401)
        .send(errorResponse("Unauthorized: JWT payload not found", 401));
    }

    const userAccess = await userRepository.findOneBy({
      id: req.jwtPayload.id,
    });

    if (!userAccess) {
      return res.status(404).send(errorResponse("User not found", 404));
    }

    if (userAccess.role !== UserRole.ADMIN) {
      return res
        .status(403)
        .send(
          errorResponse(
            "Access Denied: Only ADMIN can access this resource",
            403,
          ),
        );
    }

    // If user is admin, proceed to next middleware/controller
    next();
  } catch (_error) {
    return res.status(500).send(errorResponse("Internal server error", 500));
  }
};


export const onlyParticipantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.jwtPayload?.id) {
      return res
        .status(401)
        .send(errorResponse("Unauthorized: JWT payload not found", 401));
    }

    const userAccess = await userRepository.findOneBy({
      id: req.jwtPayload.id,
    });

    if (!userAccess) {
      return res.status(404).send(errorResponse("User not found", 404));
    }

    if (userAccess.role !== UserRole.PARTICIPANT) {
      return res
        .status(403)
        .send(
          errorResponse(
            "Access Denied: Only PARTICIPANT can access this resource",
            403,
          ),
        );
    }

    // If user is PARTICIPANT, proceed to next middleware/controller
    next();
  } catch (_error) {
    return res.status(500).send(errorResponse("Internal server error", 500));
  }
};
