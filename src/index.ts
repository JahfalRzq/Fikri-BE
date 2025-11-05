import path from "path"
import * as bodyParser from "body-parser"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"

import { AppDataSource } from "./data-source"
import router from "./routes/index"

dotenv.config()

// Register and preload canvas fonts (side-effect module)
import "@/utils/canvas-setup";

const app = express()

// Database initialization flag
let isDbInitialized = false

// Initialize database connection
async function initializeDatabase() {
  if (!isDbInitialized) {
    try {
      await AppDataSource.initialize()
      isDbInitialized = true
      console.info("Database initialized successfully")
    } catch (error) {
      console.error("Error during DB initialization:", error)
      throw error
    }
  }
}

// Configure middleware
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://certification-training-api.vercel.app",
      "https://certification-training-jade.vercel.app",
    ],
  }),
)
app.use(bodyParser.json({ limit: "1000mb" }))
app.use(bodyParser.urlencoded({ extended: true }))
app.use("/public", express.static(path.join(__dirname, "../public")))

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  try {
    await initializeDatabase()
    next()
  } catch (error) {
    console.error("Database initialization failed:", error)
    res.status(500).json({ error: "Database connection failed" })
  }
})

app.get("/", (req, res) => {
  res.send("Certificate Digital API ready🚀")
})

app.use("/", router)

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.APP_PORT || 3000
  app.listen(PORT, () => {
    console.info(`Server running at port ${PORT}`)
  })
}

app.use('/certificates', express.static(path.join(process.cwd(), 'public', 'certificates')));
app.use('/templates', express.static(path.join(process.cwd(), 'public', 'templates')));

app.use('/certificates', (req, res, next) => {
  console.log(`📄 Certificate request: ${req.url}`);
  next();
});

// Export for Vercel
export default app
