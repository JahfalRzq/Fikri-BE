import jwt, { SignOptions } from 'jsonwebtoken'
import { JwtPayload } from '../types/JwtPayload'
import dotenv from 'dotenv'

dotenv.config()

export const createJwtToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: 60 * 60 * 24 // Default to 1 day
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, options)
}
