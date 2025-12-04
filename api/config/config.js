// config/config.js

import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
    //  Ortam değişkenleri
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 5000,
    appName: "SmartQ API",

    //  Veritabanı bağlantısı
    databaseUrl: process.env.DATABASE_URL,
    logLevel: process.env.LOG_LEVEL || "info",

    //  JWT ayarları
    jwtSecret: process.env.JWT_SECRET || "fallback_secret_key",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "fallback_refresh_key",
};
