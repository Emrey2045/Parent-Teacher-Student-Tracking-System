// routes/authRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { successResponse, errorResponse } from "../utils/responseHelper.js";
import { CONFIG } from "../config/config.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/* ============================
    KULLANICI KAYDI (Register)
============================ */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Email kontrolü
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser)
            return errorResponse(res, "Bu e-posta adresiyle kayıtlı bir kullanıcı var", 400);

        // Şifre hashleme
        const hashedPassword = await bcrypt.hash(password, 10);

        // Kullanıcı oluştur
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "user",
            },
        });

        return successResponse(res, newUser, "Kullanıcı başarıyla oluşturuldu");
    } catch (err) {
        console.error("REGISTER ERROR:", err);
        return errorResponse(res, "Kullanıcı oluşturulurken bir hata oluştu", 500);
    }
});

/* ============================
    GİRİŞ (Login)
============================ */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return errorResponse(res, "Geçersiz şifre", 401);

        if (!CONFIG.jwtSecret || !CONFIG.jwtRefreshSecret)
            return errorResponse(res, "Sunucu yapılandırma hatası: JWT_SECRET eksik", 500);

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            CONFIG.jwtSecret,
            { expiresIn: "2h" }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            CONFIG.jwtRefreshSecret,
            { expiresIn: "7d" }
        );

        // Refresh token'ı veritabanına kaydet
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });


        console.log(`[LOGIN SUCCESS] ${user.email} - Token üretildi`);

        return successResponse(
            res,
            { accessToken, refreshToken, user },
            "Giriş başarılı"
        );
    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return errorResponse(res, "Giriş yapılırken bir hata oluştu", 500);
    }
});

/* ============================
    KULLANICI BİLGİLERİ (/me)
============================ */
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });

        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);
        return successResponse(res, user, "Kullanıcı bilgisi getirildi");
    } catch (err) {
        console.error("ME ERROR:", err);
        return errorResponse(res, "Kullanıcı bilgisi alınamadı", 500);
    }
});

/* ============================
    TOKEN YENİLEME (/refresh)
============================ */
router.post("/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, "Refresh token gerekli", 400);

    try {
        const decoded = jwt.verify(refreshToken, CONFIG.jwtRefreshSecret);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user || user.refreshToken !== refreshToken) {
            return errorResponse(res, "Geçersiz veya eşleşmeyen refresh token", 403);
        }

        //  Yeni access & refresh token üret
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            CONFIG.jwtSecret,
            { expiresIn: "2h" }
        );

        const newRefreshToken = jwt.sign(
            { id: user.id },
            CONFIG.jwtRefreshSecret,
            { expiresIn: "7d" }
        );

        // DB'deki refresh token'ı güncelle
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: newRefreshToken },
        });

        console.log(`[TOKEN REFRESH] ${user.email} için yeni token üretildi`);

        return successResponse(
            res,
            { accessToken: newAccessToken, refreshToken: newRefreshToken },
            "Token başarıyla yenilendi"
        );
    } catch (err) {
        console.error("REFRESH ERROR:", err);
        return errorResponse(res, "Refresh token geçersiz veya süresi dolmuş", 403);
    }
});

/* ============================
    ŞİFRE DEĞİŞTİRME (/change-password)
============================ */
router.post("/change-password", authMiddleware, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword)
            return errorResponse(res, "Eski ve yeni şifre gereklidir", 400);

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return errorResponse(res, "Kullanıcı bulunamadı", 404);

        const valid = await bcrypt.compare(oldPassword, user.password);
        if (!valid) return errorResponse(res, "Eski şifre hatalı", 401);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        console.log(`[PASSWORD CHANGE] ${user.email} şifresini güncelledi`);

        return successResponse(res, null, "Şifre başarıyla değiştirildi");
    } catch (err) {
        console.error("CHANGE PASSWORD ERROR:", err);
        return errorResponse(res, "Şifre değiştirilirken bir hata oluştu", 500);
    }
});

/* ============================
    LOGOUT
============================ */
router.post("/logout", authMiddleware, async (req, res) => {
    try {
        await prisma.user.update({
            where: { id: req.user.id },
            data: { refreshToken: null },
        });

        console.log(`[LOGOUT] ${req.user.id} çıkış yaptı`);
        return successResponse(res, null, "Çıkış başarılı");
    } catch (err) {
        console.error("LOGOUT ERROR:", err);
        return errorResponse(res, "Çıkış yapılırken hata oluştu", 500);
    }
});


export default router;
