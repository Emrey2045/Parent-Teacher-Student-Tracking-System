// middlewares/roleGuard.js
import { errorResponse } from "../utils/responseHelper.js";

/**
 * Kullanıcının rolüne göre erişim izni verir.
 * Örnek: roleGuard("admin") → sadece admin erişebilir
 */
export const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return errorResponse(res, "Kullanıcı kimliği doğrulanamadı", 401);
        }

        // Eğer kullanıcının rolü izinli roller içinde değilse engelle
        if (!allowedRoles.includes(userRole)) {
            return errorResponse(res, "Bu işlem için yetkiniz yok", 403);
        }

        next();
    };
};
