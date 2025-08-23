// middleware/checkBlockStatus.js
const client = require("../../config/db"); // Подключение к базе данных

const checkBlockStatus = async (req, res, next) => {
    try {
        console.log("req.user:", req.user); // Логируем объект req.user
        const userId = req.user?.userId; // Получаем ID пользователя из req.user (предполагается, что verifyToken его добавляет)

        if (!userId) {
            return res.status(401).json({ message: "Не авторизован" });
        }

        const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
        const blockedResult = await client.query(checkBlockedQuery, [userId]);

        if (blockedResult.rows.length === 0) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        const isBlocked = blockedResult.rows[0].is_blocked;

        if (isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
            });
        }

        next(); // Если пользователь не заблокирован, пропускаем запрос дальше
    } catch (error) {
        console.error("Ошибка при проверке статуса блокировки:", error);
        return res.status(500).json({ message: "Ошибка сервера" });
    }
};

module.exports = checkBlockStatus;