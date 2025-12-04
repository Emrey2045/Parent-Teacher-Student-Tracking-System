// middlewares/requestLogger.js
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    // İstek tamamlandığında tetiklenecek
    res.on("finish", () => {
        const duration = Date.now() - start;
        const method = req.method;
        const url = req.originalUrl;
        const status = res.statusCode;

        const color =
            status >= 500 ? "\x1b[31m" : // kırmızı (server error)
                status >= 400 ? "\x1b[33m" : // sarı (client error)
                    "\x1b[32m";                  // yeşil (başarılı)

        console.log(
            `${color}[${method}] ${url} → ${status} (${duration}ms)\x1b[0m`
        );
    });

    next();
};
