// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/responseHelper.js";

/* ===========================
    Token Doğrulama Middleware
=========================== */
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return errorResponse(res, "Yetkilendirme gerekli", 401);
    }

    const token = authHeader.split(" ")[1];

    try {
        //  Doğrudan .env dosyasındaki JWT_SECRET kullanılıyor
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Token içeriğini request'e ekle
        req.user = decoded; // { id, role }

        next();
    } catch (err) {
        console.error("JWT doğrulama hatası:", err.message);
        return errorResponse(res, "Geçersiz veya süresi dolmuş token", 403);
    }
};

/* ===========================
    Sadece Admin Erişimi
=========================== */
export const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
        return errorResponse(res, "Bu işlem için admin yetkisi gerekli", 403);
    }
    next();
};
