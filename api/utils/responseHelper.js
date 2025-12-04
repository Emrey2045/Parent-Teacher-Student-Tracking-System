// utils/responseHelper.js
export const successResponse = (res, data, message = "İşlem başarılı") => {
    return res.json({
        success: true,
        message,
        data,
    });
};

export const errorResponse = (res, message = "Bir hata oluştu", status = 500) => {
    return res.status(status).json({
        success: false,
        message,
    });
};
