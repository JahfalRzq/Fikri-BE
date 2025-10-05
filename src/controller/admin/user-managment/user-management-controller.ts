import { Request, Response } from 'express';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '@/data-source';
import { user, UserRole } from '@/model/user';


import { errorResponse, successResponse, validationResponse } from '@/utils/response';

const userRepository = AppDataSource.getRepository(user);



export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const {
            username,
            email,
            role,
            phone,
            limit: queryLimit,
            page,
        } = req.query;

        const queryBuilder = userRepository
            .createQueryBuilder("user")
            .orderBy("user.createdAt", "DESC");

        if (username) {
            queryBuilder.andWhere("user.username LIKE :username", {
                username: `%${String(username)}%`,
            });
        }

        if (email) {
            queryBuilder.andWhere("user.email LIKE :email", {
                email: `%${String(email)}%`,
            });
        }

        if (role) {
            queryBuilder.andWhere("user.role LIKE :role", {
                role: `%${String(role)}%`,
            });
        }

        if (phone) {
            queryBuilder.andWhere("user.phone LIKE :phone", {
                phone: `%${String(phone)}%`,
            });
        }

        const dynamicLimit = queryLimit ? parseInt(queryLimit as string) : 10; // default 10
        const currentPage = page ? parseInt(page as string) : 1;
        const skip = (currentPage - 1) * dynamicLimit;

        const [rawData, totalCount] = await queryBuilder
            .skip(skip)
            .take(dynamicLimit)
            .getManyAndCount();


        // Transform data to include totalTrainings
        const data = rawData.map((user) => ({
            ...user,
            trainings: undefined, // Remove trainings array from response
        }));

        return res.status(200).send(
            successResponse(
                "Get Users Success",
                {
                    data,
                    totalCount,
                    currentPage,
                    totalPages: Math.ceil(totalCount / (dynamicLimit ?? 1)),
                },
                200,
            ),
        );
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};


export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const result = await userRepository.findOneBy({ id });
        if (!result) return res.status(404).json({ msg: "User Not Found" });
        return res
            .status(200)
            .send(
                successResponse("Get User by ID Success", { data: result }, 200),
            );
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
};


export const createUser = async (req: Request, res: Response) => {
    const createUserSchema = (input: any) =>
        Joi.object({
            username: Joi.string().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid(...Object.values(UserRole)).required(),
        }).validate(input);

    try {
        const body = req.body;
        const schema = createUserSchema(body);
        if ("error" in schema) {
            return res.status(422).send(validationResponse(schema));
        }

        const { password, role, username, phone } = body;

        // Cek apakah email sudah terdaftar


        const newUser = new user(); // Pastikan nama kelasnya sesuai dengan definisi Anda
        newUser.userName = username; // Perbaiki properti ini jika tidak sesuai dengan definisi kelas User
        newUser.password = bcrypt.hashSync(password, 8);
        newUser.role = role;
        console.log("create user", newUser);
        await userRepository.save(newUser);

        return res.status(201).send(successResponse('User created successfully', { data: newUser }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const updateUserSchema = (input: any) =>
        Joi.object({
            username: Joi.string().required(),
            password: Joi.string().min(6).required(),
            role: Joi.string().valid(...Object.values(UserRole)).required(),
        }).validate(input);
    try {
        const { id } = req.params;
        const body = req.body;
        const schema = updateUserSchema(req.body);

        if ("error" in schema) {
            return res.status(422).send(validationResponse(schema));
        }

        const updateUser = await userRepository.findOneBy({ id });
        if (!updateUser) {
            return res.status(404).json({ msg: "Training Not Found" });
        }

        updateUser.userName = body.username; // Perbaiki properti ini jika tidak sesuai dengan definisi kelas User
        updateUser.password = bcrypt.hashSync(body.password, 8);
        updateUser.role = body.role;
        console.log("create user", updateUser);

        await userRepository.save(updateUser);

        return res
            .status(200)
            .send(
                successResponse(
                    "Update Training Success",
                    { data: updateUser },
                    200,
                ),
            );
    } catch (error) {
        return res.status(500).json({
            message:
                error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};


export const deleteUser = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await userRepository.findOneBy({ id });
        if (!user) {
            return res.status(404).send(validationResponse('User not found'));
        }

        await userRepository.remove(user);

        return res.status(201).send(successResponse('User deleted successfully', { data: user }, 201));
    } catch (error) {
        return res.status(500).json({
            message: error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
};


