const jwt = require("jsonwebtoken");
// const SECRET_KEY = process.env.SECRET_KEY || "guram";
const SECRET_KEY = "guram"; //JWT

const verifyToken = (req, res, next) => {
    console.log("\n=== Начало проверки токена ===");

    // 1. Проверяем заголовок
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        console.log("❌ Ошибка: заголовок отсутствует");
        return res.status(401).json({ message: "Токен отсутствует" });
    }

    // 2. Извлекаем токен
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        console.log("❌ Ошибка: неверный формат заголовка");
        return res.status(401).json({ message: "Неверный формат токена" });
    }

    const token = tokenParts[1];
    console.log("🔑 Полученный токен:", token);

    // 3. Синхронная верификация (убираем колбэк!)
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("✅ Токен валиден:", decoded);

        req.user = {
            id: decoded.userId,
            email: decoded.email
        };

        return next();
    } catch (err) {
        console.log("❌ Ошибка верификации:", err.message);

        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Токен истёк, войдите снова" });
        }
        return res.status(401).json({ message: "Неверный токен" });
    }
};


// Middleware для проверки токена
// const verifyToken = (req, res, next) => {
//     console.log("Проверка токена..."); // Логируем начало проверки токена
//     console.log("Фактический SECRET_KEY:", SECRET_KEY);
//     console.log("Длина ключа:", SECRET_KEY.length);

//     const testVerify = jwt.verify(
//     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYwLCJlbWFpbCI6ImZveDc4OTA3ODY0QGdtYWlsLmNvbSIsImlhdCI6MTc1MzcxMTI4MiwiZXhwIjoxNzU0MzE2MDgyfQ.vCq9IjpUEOS4jj0VBfO3Z2XA-NcPQiisc9CCoCX-Emc", // Полный токен
//     SECRET_KEY
//     );
//     console.log("Тест верификации:", testVerify);
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//         console.log("Токен отсутствует."); // Логируем отсутствие токена
//         res.writeHead(401, { "Content-Type": "application/json" });
//         return res.end(JSON.stringify({ message: "Нет доступа! Токен отсутствует." }));
//     }

//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, SECRET_KEY, (err, decoded) => {
//         if (err) {
//             if (err.name === "TokenExpiredError") {
//                 // Обработка истечения токена
//                 res.writeHead(403, { "Content-Type": "application/json" });
//                 return res.end(JSON.stringify({ message: "Токен истек. Пожалуйста, войдите снова." }));
//             }
//             // Обработка других ошибок
//             res.writeHead(403, { "Content-Type": "application/json" });
//             return res.end(JSON.stringify({ message: "Неверный токен." }));
//         }
//         console.log("Декодированный токен:", decoded); // Логируем декодированные данные токена
//         // req.user = decoded;
//         req.user = {
//             id: decoded.userId,
//             email: decoded.email
//         };
//         next();
//     });
//     console.log("Проверка токена завершена."); // Логируем завершение проверки токена
// };

module.exports = { verifyToken };