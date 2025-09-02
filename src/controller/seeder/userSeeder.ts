import { Request, Response } from "express";
import { AppDataSource } from "../../data-source";
import { user,UserRole } from "../../model/user";

const { successResponse, errorResponse, validationResponse } = require('../../utils/response')


const userRepository = AppDataSource.getRepository(user)


export const userSeeder = async (req: Request, res: Response) => {
    const userSeed = [
        {userName : "Admin1",password : "Admin1!0)"},
    ];
    try{
        for (const data of userSeed){
            const newUser = new user()
            newUser.userName = data.userName
            newUser.password =  data.password
            newUser.role = UserRole.ADMIN
            newUser.hashPassword()
            await userRepository.save(newUser)
        }
        console.log("User seeded successfully.");

    }catch(error){
        return res.status(400).send(errorResponse(error,400))
    }
}