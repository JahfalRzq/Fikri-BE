import type { Request, Response } from "express";
import { user } from "@/model/user";
import { AppDataSource } from "@/data-source";
import type { JwtPayload } from "@/types/jwt-payload";
import { createJwtToken } from "@/utils/createJwtToken";
import Joi from "joi";
import {
    successResponse,
    errorResponse,
} from "@/utils/response";
const { joiPasswordExtendCore } = require("joi-password");

const _joiPassword = Joi.extend(joiPasswordExtendCore);
const userRepository = AppDataSource.getRepository(user);

export const fetch = async (req: Request, res: Response) => {
    try {
        const userFetch = await userRepository.findOneBy({ id: req.jwtPayload?.id });

        return res
            .status(200)
            .send(successResponse("User Authorized", { data: userFetch }, 200));
    } catch (error) {
        return res.status(400).send(errorResponse(
            error instanceof Error ? error.message : 'Unknown error occurred',
            400
        ));
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { userName, password } = req.body;

        const user = await userRepository.findOne({
            where: {
                userName: userName,
            },
        });

        if (!user) {
            return res.status(401).send(errorResponse("Incorect username", 401));
        }

        if (!user.checkIfPasswordMatch(password)) {
            return res.status(401).send(errorResponse("Incorect password", 401));
        }

        const jwtPayload: JwtPayload = {
            id: user.id,
            userName: user.userName,
            email: user.email,
            createdAt: user.createdAt,
        };

        const token = createJwtToken(jwtPayload);
        const data = { user, token };

        return res
            .status(200)
            .send(successResponse("Login Success", { data: data }, res.statusCode));
    } catch (error) {
        return res.status(400).send(errorResponse(
            error instanceof Error ? error.message : 'Unknown error occurred',
            400
        ));
    }
};
