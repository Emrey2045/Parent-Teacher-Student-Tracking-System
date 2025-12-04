import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================
    Öğretmen Listeleme
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let teachers = [];

        if (user.role === "admin") {
            teachers = await prisma.teacher.findMany({
                include: { school: true, user: true },
            });
        } else if (user.role === "manager") {
            const school = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (school) {
                teachers = await prisma.teacher.findMany({
                    where: { schoolId: school.id },
                    include: { school: true, user: true },
                });
            }
        } else if (user.role === "teacher") {
            teachers = await prisma.teacher.findMany({
                where: { userId: user.id },
                include: { school: true, user: true },
            });
        } else {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        return successResponse(res, teachers, "Öğretmenler başarıyla listelendi");
    } catch (err) {
        console.error(" /teachers GET hatası:", err.message);
        return errorResponse(res, "Öğretmenler listelenirken hata oluştu");
    }
});

/* ===========================
   Tekil Öğretmen Detayı
=========================== */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const teacherId = parseInt(req.params.id);
        const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
            include: { school: true, user: true },
        });

        if (!teacher) return errorResponse(res, "Öğretmen bulunamadı", 404);

        const user = req.user;

        // Manager → yalnızca kendi okulundaki öğretmenleri görebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (!managerSchool || teacher.schoolId !== managerSchool.id) {
                return errorResponse(res, "Bu öğretmen sizin okulunuza ait değil", 403);
            }
        }

        //  Teacher → yalnızca kendini görebilir
        if (user.role === "teacher" && teacher.userId !== user.id) {
            return errorResponse(res, "Kendi dışınızdaki öğretmen bilgilerine erişemezsiniz", 403);
        }

        return successResponse(res, teacher, "Öğretmen bilgileri getirildi");
    } catch (err) {
        console.error(" /teachers/:id hatası:", err.message);
        return errorResponse(res, "Öğretmen bilgileri alınamadı");
    }
});

/* ===========================
  Yeni Öğretmen Ekleme
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin" && user.role !== "manager")
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const { name, subject, schoolId, className, userId } = req.body;
        if (!name || !subject || !schoolId)
            return errorResponse(res, "Zorunlu alanlar eksik (name, subject, schoolId)", 400);

        //  Manager yalnızca kendi okuluna öğretmen ekleyebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (!managerSchool || managerSchool.id != schoolId) {
                return errorResponse(res, "Sadece kendi okulunuza öğretmen ekleyebilirsiniz", 403);
            }
        }

        const newTeacher = await prisma.teacher.create({
            data: {
                name,
                subject,
                className,
                school: { connect: { id: Number(schoolId) } },
                ...(userId && { user: { connect: { id: userId } } }),
            },
            include: { school: true, user: true },
        });

        return successResponse(res, newTeacher, "Öğretmen başarıyla eklendi");
    } catch (err) {
        console.error(" /teachers POST hatası:", err.message);
        return errorResponse(res, "Öğretmen eklenirken hata oluştu");
    }
});

/* ===========================
    Öğretmen Güncelleme
=========================== */
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin" && user.role !== "manager")
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const teacherId = parseInt(req.params.id);
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) return errorResponse(res, "Öğretmen bulunamadı", 404);

        // Manager yalnızca kendi okulundaki öğretmeni güncelleyebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (!managerSchool || teacher.schoolId !== managerSchool.id) {
                return errorResponse(res, "Bu öğretmen sizin okulunuza ait değil", 403);
            }
        }

        const { name, subject, className, userId } = req.body;

        const updatedTeacher = await prisma.teacher.update({
            where: { id: teacherId },
            data: {
                ...(name && { name }),
                ...(subject && { subject }),
                ...(className && { className }),
                ...(userId && { user: { connect: { id: userId } } }),
            },
            include: { school: true, user: true },
        });

        return successResponse(res, updatedTeacher, "Öğretmen bilgileri güncellendi");
    } catch (err) {
        console.error(" /teachers PATCH hatası:", err.message);
        return errorResponse(res, "Öğretmen güncellenirken hata oluştu");
    }
});

/* ===========================
    Öğretmen Silme
=========================== */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin" && user.role !== "manager")
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const teacherId = parseInt(req.params.id);
        const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
        if (!teacher) return errorResponse(res, "Öğretmen bulunamadı", 404);

        // Manager yalnızca kendi okulundaki öğretmeni silebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({
                where: { managerId: user.id },
            });
            if (!managerSchool || teacher.schoolId !== managerSchool.id) {
                return errorResponse(res, "Bu öğretmen sizin okulunuza ait değil", 403);
            }
        }

        await prisma.teacher.delete({ where: { id: teacherId } });
        return successResponse(res, null, "Öğretmen başarıyla silindi");
    } catch (err) {
        console.error(" /teachers DELETE hatası:", err.message);
        return errorResponse(res, "Öğretmen silinirken hata oluştu");
    }
});

export default router;
