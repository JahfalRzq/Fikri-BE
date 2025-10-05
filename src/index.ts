import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import { AppDataSource } from "./data-source";
import router from "./routes/index";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
(async () => {
    try {
        await AppDataSource.initialize()
    } catch (error) {
        console.error("Error during DB initialization:", error)
    }
    const app = express();
    app.use(
        cors({
            credentials: true,
            origin: ["http://localhost:3000", "http://localhost:3001"],
        }),
    );
    app.use(bodyParser.json({ limit: "1000mb" }));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use("/public", express.static(path.join(__dirname, "../public")));
    app.get("/", (req, res) => {
        res.send("Certificate Digital API ready🚀");
    });
    app.use("/", router);
    app.listen(process.env.APP_PORT, () => {
        console.info(`Server running at port ${process.env.APP_PORT}`);
    });
})().catch((error) => console.warn("Error:", error));

