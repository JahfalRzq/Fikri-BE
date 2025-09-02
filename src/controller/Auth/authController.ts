import { Request, Response } from "express";
import { user,UserRole } from "../../model/user";
import { AppDataSource } from "../../data-source";
import { JwtPayload } from "../../types/JwtPayload";
import { createJwtToken } from "../../utils/createJwtToken";
import Joi from "joi";
const { joiPasswordExtendCore } = require('joi-password')
const joiPassword = Joi.extend(joiPasswordExtendCore)


const { successResponse, errorResponse,validationResponse } = require('../../utils/response')

const userRepository = AppDataSource.getRepository(user)

export const fetch = async (req: Request, res: Response) => {
    try {
        const userFetch = await userRepository.findOneBy({ id: req.jwtPayload.id })

            return res.status(200).send(successResponse('User Authorized', { data: userFetch }, 200))

    } catch (error) {
        return res.status(400).send(errorResponse(error, 400))
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { userName, password } = req.body

        const user = await userRepository.findOne({
            where: {
                userName: userName
            }
        })

        if (!user) {
            return res.status(409).send(errorResponse('Incorect username', 409))
        }

        if (!user.checkIfPasswordMatch(password)) {
            return res.status(409).send(errorResponse('Incorect password', 409))
        }


        const jwtPayload: JwtPayload = {
            id: user.id,
            userName: user.userName,
            email : user.email,
            createdAt: user.createdAt,
        }

        const token = createJwtToken(jwtPayload)
        const data = { user, token }

        return res.status(200).send(successResponse("Login Success", { data: data }, res.statusCode))
    } catch (error) {
        return res.status(400).send(errorResponse(error, 400))
    }
}
