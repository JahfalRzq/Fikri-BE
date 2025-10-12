import "reflect-metadata"

import dotenv from "dotenv"
import { DataSource } from "typeorm"

dotenv.config()

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: true,
  logging: true,
  entities: ["src/model/**/*.ts"], // ✅ perbaikan path
  migrations: ["src/migrations/**/*.ts"], // ✅ perbaikan folder
  subscribers: [],
  // timezone: 'Asia/Jakarta', // Mengatur timezone di sini
})
