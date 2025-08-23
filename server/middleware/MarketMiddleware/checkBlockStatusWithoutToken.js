const client = require("../../config/db"); // Подключение к базе данных


const checkBlockStatusWithoutToken = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        console.log("userId из заголовка:", userId);
        
        if (!userId) {
            // return res.status(400).json({ message: "ID пользователя не указан" });
            console.warn("userId не указан в заголовке");
            return next(); // Если userId не указан, пропускаем запрос дальше
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

module.exports = checkBlockStatusWithoutToken;