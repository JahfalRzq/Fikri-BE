import type { JwtPayload } from "@/types/jwt-payload"

declare global {
  namespace Express {
    export interface Request {
      jwtPayload?: JwtPayload
    }
  }
}
