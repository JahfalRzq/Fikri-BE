import jwt, { SignOptions } from 'jsonwebtoken'
import { JwtPayload } from '../types/JwtPayload'
import dotenv from 'dotenv'

dotenv.config()

export const createJwtToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRATION ? 
      parseInt(process.env.JWT_EXPIRATION) : 
      2592000 // default 1 jam dalam detik
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, options)
}
