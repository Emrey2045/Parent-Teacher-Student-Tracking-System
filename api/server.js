// SmartQ API – Express + Prisma + PostgreSQL
// Developer: Şeyma Yıldırım

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { CONFIG } from "./config/config.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { successResponse, errorResponse } from "./utils/responseHelper.js";

// 🔹 Route imports
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import schoolRoutes from "./routes/schoolRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";

dotenv.config();
const app = express();

/* ===========================
   🌍 Global Middleware
=========================== */
app.use(cors());
app.use(express.json());
app.use(requestLogger);

/* ===========================
   🔗 Route Grupları
=========================== */
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/students", studentRoutes);
app.use("/teachers", teacherRoutes);
app.use("/schools", schoolRoutes);
app.use("/parents", parentRoutes);

/* ===========================
   ✅ Test Endpoint
=========================== */
app.get("/", (req, res) =>
    successResponse(res, null, "SmartQ API is running ✅")
);

/* ===========================
   🚨 Error Handling
=========================== */
app.use((req, res) =>
    errorResponse(res, `URL bulunamadı: ${req.originalUrl}`, 404)
);
app.use(errorHandler);

/* ===========================
   🚀 Server Start
=========================== */
const PORT = CONFIG.port;
app.listen(PORT, () => {
    console.log(
        `🚀 ${CONFIG.appName} is running on port ${PORT} (${CONFIG.env} mode)`
    );
});
