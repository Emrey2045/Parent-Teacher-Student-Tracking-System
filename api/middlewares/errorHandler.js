// middlewares/errorHandler.js
export function errorHandler(err, req, res, next) {
    console.error("🔥 HATA:", err.message);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Beklenmedik bir hata oluştu.",
    });
}
