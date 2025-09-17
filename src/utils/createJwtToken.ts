import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/types/jwt-payload";
import dotenv from "dotenv";

dotenv.config();

export const createJwtToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: 60 * 60 * 24, // Default to 1 day
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};
