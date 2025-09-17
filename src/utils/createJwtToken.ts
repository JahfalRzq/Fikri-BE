import type { SignOptions } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "@/types/jwt-payload";

export const createJwtToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: 60 * 60 * 24, // Default to 1 day
  };

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  return jwt.sign(payload, secret, options);
};
