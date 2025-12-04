import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { successResponse, errorResponse } from "../utils/responseHelper.js";

const router = express.Router();
const prisma = new PrismaClient();

/* ===========================
    Öğrencileri Listele
=========================== */
router.get("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        let students = [];

        switch (user.role) {
            case "admin":
                students = await prisma.student.findMany({
                    include: { parent: true, school: true },
                });
                break;

            case "manager": {
                const managerSchool = await prisma.school.findFirst({
                    where: { managerId: user.id },
                });
                if (managerSchool) {
                    students = await prisma.student.findMany({
                        where: { schoolId: managerSchool.id },
                        include: { parent: true, school: true },
                    });
                }
                break;
            }

            case "teacher": {
                const teacher = await prisma.teacher.findFirst({
                    where: { userId: user.id },
                });
                if (teacher) {
                    students = await prisma.student.findMany({
                        where: {
                            schoolId: teacher.schoolId,
                            grade: teacher.className,
                        },
                        include: { parent: true, school: true },
                    });
                }
                break;
            }

            case "parent": {
                const parent = await prisma.parent.findFirst({
                    where: { userId: user.id },
                });
                if (parent) {
                    students = await prisma.student.findMany({
                        where: { parentId: parent.id },
                        include: { parent: true, school: true },
                    });
                }
                break;
            }

            case "student": {
                const student = await prisma.student.findFirst({
                    where: { userId: user.id },
                    include: { parent: true, school: true },
                });
                if (student) students = [student];
                break;
            }

            default:
                return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        return successResponse(res, students, "Öğrenciler başarıyla listelendi");
    } catch (err) {
        console.error(" /students GET hatası:", err.message);
        return errorResponse(res, "Öğrenciler listelenirken hata oluştu");
    }
});

/* ===========================
    Tekil Öğrenci Detayı
=========================== */
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const studentId = parseInt(req.params.id);
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { school: true, parent: true },
        });

        if (!student) return errorResponse(res, "Öğrenci bulunamadı", 404);
        const user = req.user;

        //  Öğretmen → sadece kendi sınıfındaki öğrenciyi görebilir
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || student.schoolId != teacher.schoolId || student.grade !== teacher.className) {
                return errorResponse(res, "Bu öğrenci sizin sınıfınıza ait değil", 403);
            }
        }

        //  Yönetici → sadece kendi okulundaki öğrenciyi görebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (!managerSchool || student.schoolId != managerSchool.id) {
                return errorResponse(res, "Bu öğrenci sizin okulunuza ait değil", 403);
            }
        }

        //  Veli → sadece kendi çocuğunu görebilir
        if (user.role === "parent") {
            const parent = await prisma.parent.findFirst({ where: { userId: user.id } });
            if (!parent || student.parentId !== parent.id) {
                return errorResponse(res, "Bu öğrenci sizin çocuğunuz değil", 403);
            }
        }

        //  Öğrenci → sadece kendini görebilir
        if (user.role === "student") {
            const self = await prisma.student.findFirst({ where: { userId: user.id } });
            if (!self || self.id !== student.id) {
                return errorResponse(res, "Kendi dışınızdaki öğrenciye erişemezsiniz", 403);
            }
        }

        return successResponse(res, student, "Öğrenci bilgileri getirildi");
    } catch (err) {
        console.error(" /students/:id GET hatası:", err.message);
        return errorResponse(res, "Öğrenci bilgileri alınamadı");
    }
});

/* ===========================
    Yeni Öğrenci Ekle
=========================== */
router.post("/", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!["admin", "manager", "teacher"].includes(user.role))
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const { name, grade, schoolId, parentId, userId } = req.body;
        if (!name?.trim() || !grade?.trim() || !schoolId)
            return errorResponse(res, "Zorunlu alanlar eksik (name, grade, schoolId)", 400);

        //  Öğretmen sadece kendi sınıfına öğrenci ekleyebilir
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || teacher.schoolId != schoolId || teacher.className !== grade) {
                return errorResponse(res, "Sadece kendi sınıfınıza öğrenci ekleyebilirsiniz", 403);
            }
        }

        //  Yönetici sadece kendi okuluna ekleme yapabilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (!managerSchool || managerSchool.id != schoolId) {
                return errorResponse(res, "Sadece kendi okulunuza öğrenci ekleyebilirsiniz", 403);
            }
        }

        const newStudent = await prisma.student.create({
            data: {
                name: name.trim(),
                grade: grade.trim(),
                school: { connect: { id: Number(schoolId) } },
                ...(parentId && { parent: { connect: { id: parentId } } }),
                ...(userId && { user: { connect: { id: userId } } }),
            },
            include: { parent: true, school: true },
        });

        return successResponse(res, newStudent, "Yeni öğrenci başarıyla eklendi");
    } catch (err) {
        console.error(" /students POST hatası:", err.message);
        return errorResponse(res, "Öğrenci eklenirken hata oluştu");
    }
});

/* ===========================
    Öğrenci Güncelle
=========================== */
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!["admin", "manager", "teacher"].includes(user.role))
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const studentId = parseInt(req.params.id);
        const { name, grade, parentId, userId } = req.body;
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) return errorResponse(res, "Öğrenci bulunamadı", 404);

        //  Öğretmen sadece kendi sınıfındaki öğrenciyi güncelleyebilir
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || student.schoolId != teacher.schoolId || student.grade !== teacher.className) {
                return errorResponse(res, "Bu öğrenci sizin sınıfınıza ait değil", 403);
            }
        }

        //  Yönetici sadece kendi okulundaki öğrencileri güncelleyebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (!managerSchool || student.schoolId != managerSchool.id) {
                return errorResponse(res, "Bu öğrenci sizin okulunuza ait değil", 403);
            }
        }

        const updated = await prisma.student.update({
            where: { id: studentId },
            data: {
                ...(name && { name }),
                ...(grade && { grade }),
                ...(parentId && { parentId }),
                ...(userId && { userId }),
            },
            include: { parent: true, school: true },
        });

        return successResponse(res, updated, "Öğrenci bilgileri güncellendi");
    } catch (err) {
        console.error(" /students PATCH hatası:", err.message);
        return errorResponse(res, "Öğrenci güncellenirken hata oluştu");
    }
});

/* ===========================
    Öğrenci Sil
=========================== */
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!["admin", "manager", "teacher"].includes(user.role))
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);

        const studentId = parseInt(req.params.id);
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) return errorResponse(res, "Öğrenci bulunamadı", 404);

        //  Öğretmen sadece kendi sınıfındaki öğrenciyi silebilir
        if (user.role === "teacher") {
            const teacher = await prisma.teacher.findFirst({ where: { userId: user.id } });
            if (!teacher || student.schoolId != teacher.schoolId || student.grade !== teacher.className) {
                return errorResponse(res, "Bu öğrenci sizin sınıfınıza ait değil", 403);
            }
        }

        //  Yönetici sadece kendi okulundaki öğrenciyi silebilir
        if (user.role === "manager") {
            const managerSchool = await prisma.school.findFirst({ where: { managerId: user.id } });
            if (!managerSchool || student.schoolId != managerSchool.id) {
                return errorResponse(res, "Bu öğrenci sizin okulunuza ait değil", 403);
            }
        }

        await prisma.student.delete({ where: { id: studentId } });
        return successResponse(res, null, "Öğrenci başarıyla silindi");
    } catch (err) {
        console.error(" /students DELETE hatası:", err.message);
        return errorResponse(res, "Öğrenci silinirken hata oluştu");
    }
});

export default router;
