import { JwtPayload } from '../JwtPayload';
import { Multer } from 'multer'; // Impor Multer dari multer  


declare global {
  namespace Express {
    export interface Request {
      jwtPayload: JwtPayload;
      file?: Multer.File; // Menambahkan properti file  
    }
    export interface Response {
      customSuccess(httpStatusCode: number, message: string, data?: any): Response;
    }
  }
}
