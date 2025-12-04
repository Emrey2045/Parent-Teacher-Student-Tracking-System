import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleGuard } from "../middlewares/roleGuard.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================
   Admin: Genel İstatistikler
=========================== */
router.get("/overview", authMiddleware, roleGuard("admin"), async (req, res) => {
    try {
        const [totalSchools, totalTeachers, totalStudents, totalParents] = await Promise.all([
            prisma.school.count(),
            prisma.teacher.count(),
            prisma.student.count(),
            prisma.parent.count()
        ]);

        return successResponse(res, {
            totalSchools,
            totalTeachers,
            totalStudents,
            totalParents
        }, "Genel istatistikler getirildi");
    } catch (err) {
        console.error("DASHBOARD OVERVIEW ERROR:", err);
        return errorResponse(res, "Genel istatistikler alınırken hata oluştu");
    }
});

/* ===========================
    Manager: Kendi Okulunun İstatistikleri
=========================== */
router.get("/school-stats", authMiddleware, roleGuard("manager"), async (req, res) => {
    try {
        const school = await prisma.school.findFirst({ where: { managerId: req.user.id } });
        if (!school) return errorResponse(res, "Yöneticiye bağlı okul bulunamadı", 404);

        const [teachers, students, parents] = await Promise.all([
            prisma.teacher.count({ where: { schoolId: school.id } }),
            prisma.student.count({ where: { schoolId: school.id } }),
            prisma.parent.count({
                where: { students: { some: { schoolId: school.id } } }
            })
        ]);

        return successResponse(res, {
            school: school.name,
            teachers,
            students,
            parents
        }, "Okul istatistikleri getirildi");
    } catch (err) {
        console.error("DASHBOARD SCHOOL-STATS ERROR:", err);
        return errorResponse(res, "Okul istatistikleri alınırken hata oluştu");
    }
});

export default router;
