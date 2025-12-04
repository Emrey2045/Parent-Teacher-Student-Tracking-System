import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================
    Okulları Listele
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let schools = [];

        if (user.role === "admin") {
            schools = await prisma.school.findMany({
                include: { students: true, teachers: true, manager: true },
            });
        } else if (user.role === "manager") {
            schools = await prisma.school.findMany({
                where: { managerId: user.id },
                include: { students: true, teachers: true, manager: true },
            });
        } else if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({
                where: { userId: user.id },
            });
            if (teacher) {
                const school = await prisma.school.findUnique({
                    where: { id: teacher.schoolId },
                    include: { students: true, teachers: true, manager: true },
                });
                if (school) schools = [school];
            }
        } else if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });
            const studentSchoolIds = parent?.students.map((s) => s.schoolId) || [];
            if (studentSchoolIds.length > 0) {
                schools = await prisma.school.findMany({
                    where: { id: { in: studentSchoolIds } },
                    include: { students: true, teachers: true, manager: true },
                });
            }
        } else if (user.role === "student") {
            const student = await prisma.student.findFirst({
                where: { userId: user.id },
            });
            if (student) {
                const school = await prisma.school.findUnique({
                    where: { id: student.schoolId },
                    include: { students: true, teachers: true, manager: true },
                });
                if (school) schools = [school];
            }
        }

        return successResponse(res, schools, "Okullar başarıyla listelendi");
    } catch (err) {
        console.error("❌ /schools GET hatası:", err.message);
        return errorResponse(res, "Okullar listelenirken hata oluştu");
    }
});

/* ===========================
    Tekil Okul Detayı
=========================== */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const schoolId = parseInt(req.params.id);
        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                students: { include: { parent: true } },
                teachers: { include: { user: true } },
                manager: true,
            },
        });

        if (!school) return errorResponse(res, "Okul bulunamadı", 404);

        const user = req.user;

        //  Manager yalnızca kendi okulunu görebilir
        if (user.role === "manager" && school.managerId !== user.id) {
            return errorResponse(res, "Bu okul bilgilerine erişim yetkiniz yok", 403);
        }

        //  Öğretmen yalnızca kendi okulunu görebilir
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || teacher.schoolId !== school.id) {
                return errorResponse(res, "Bu okul bilgilerine erişim yetkiniz yok", 403);
            }
        }

        //  Veli yalnızca çocuğunun okulunu görebilir
        if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({
                where: { userId: user.id },
                include: { students: true },
            });
            const hasStudentHere = parent?.students.some((s) => s.schoolId === school.id);
            if (!hasStudentHere) {
                return errorResponse(res, "Bu okul bilgilerine erişim yetkiniz yok", 403);
            }
        }

        //  Öğrenci yalnızca kendi okulunu görebilir
        if (user.role === "student") {
            const student = await prisma.student.findFirst({ where: { userId: user.id } });
            if (!student || student.schoolId !== school.id) {
                return errorResponse(res, "Bu okul bilgilerine erişim yetkiniz yok", 403);
            }
        }

        return successResponse(res, school, "Okul bilgileri başarıyla getirildi");
    } catch (err) {
        console.error("❌ /schools/:id GET hatası:", err.message);
        return errorResponse(res, "Okul bilgileri alınırken hata oluştu");
    }
});

/* ===========================
    Yeni Okul Ekle (Sadece Admin)
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Bu işlem için admin yetkisi gerekli", 403);
        }

        const { name, managerId } = req.body;
        if (!name?.trim()) {
            return errorResponse(res, "Okul adı gerekli", 400);
        }

        const newSchool = await prisma.school.create({
            data: {
                name: name.trim(),
                ...(managerId && { manager: { connect: { id: managerId } } }),
            },
            include: { manager: true },
        });

        return successResponse(res, newSchool, "Yeni okul başarıyla eklendi");
    } catch (err) {
        console.error("❌ /schools POST hatası:", err.message);
        return errorResponse(res, "Okul eklenirken hata oluştu");
    }
});

/* ===========================
    Okul Güncelle (Sadece Admin)
=========================== */
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Bu işlem için admin yetkisi gerekli", 403);
        }

        const schoolId = parseInt(req.params.id);
        const { name, managerId } = req.body;

        const updated = await prisma.school.update({
            where: { id: schoolId },
            data: {
                ...(name && { name }),
                ...(managerId && { manager: { connect: { id: managerId } } }),
            },
            include: { manager: true, students: true, teachers: true },
        });

        return successResponse(res, updated, "Okul bilgileri güncellendi");
    } catch (err) {
        console.error("❌ /schools PATCH hatası:", err.message);
        return errorResponse(res, "Okul güncellenirken hata oluştu");
    }
});

/* ===========================
    Okul Sil (Sadece Admin)
=========================== */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return errorResponse(res, "Bu işlem için admin yetkisi gerekli", 403);
        }

        const schoolId = parseInt(req.params.id);
        await prisma.school.delete({ where: { id: schoolId } });

        return successResponse(res, null, "Okul başarıyla silindi");
    } catch (err) {
        console.error("❌ /schools DELETE hatası:", err.message);
        return errorResponse(res, "Okul silinirken hata oluştu");
    }
});

export default router;
