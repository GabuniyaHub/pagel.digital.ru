const express = require("express");
const ChatRoutes = express.Router();
const path = require("path");
const fs = require("fs");

const db = require("../../config/db"); // базаданных
const { verifyToken } = require('../../middleware/authMiddleware'); // Проверка токена
const checkBlockStatusWithoutToken = require('../../middleware/MarketMiddleware/checkBlockStatusWithoutToken'); //проверка юзера на блокировку
const optionalAuth = require('../../middleware/MarketMiddleware/optionalAuth'); //Проверка в куки токен


ChatRoutes.get('/', verifyToken, () => {
    req.sendFile(path.join(__dirname, '../../../client/pages/chat/chat.html'));
});

ChatRoutes.get('/get/data/all/users', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
    try {
        const userResult = await db.query('SELECT id, nickname, avatar, registration_date, rating, email, is_premium, contacts FROM users');
        res.json(userResult.rows);
    } catch (error) {
        console.error("Ошибка при получении всех пользователей:", error);
        res.status(500).json({ error: 'Ошибка сервера при получении всех пользователей' });
    }    
});

ChatRoutes.get('/get/data/current/user', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
    const userID = req.user.id;
    try {
        const currentUserDataQuery = `
            SELECT
            u.id, u.nickname, u.email, u.avatar, u.rating, u.registration_date,
            u.description, u.verified, u.is_blocked, u.is_premium, u.contacts,
            COALESCE(json_agg(DISTINCT l.*) FILTER (WHERE l.id IS NOT NULL), '[]') AS listings,
            COALESCE(json_agg(DISTINCT r.*) FILTER (WHERE r.id IS NOT NULL), '[]') AS reviews,
            COALESCE(json_agg(DISTINCT f.*) FILTER (WHERE f.id IS NOT NULL), '[]') AS favorites
            FROM users u
            LEFT JOIN listings l ON u.id = l.user_id
            LEFT JOIN reviews r ON u.id = r.user_id
            LEFT JOIN favorites f ON u.id = f.user_id
            WHERE u.id = $1
            GROUP BY u.id
        `;

        const currentUserDataResult = await db.query(currentUserDataQuery, [userID]);
        res.json(currentUserDataResult.rows[0]);

    } catch (error) {
        console.error("Ошибка при получении данных чата:", error);
        res.status(500).json({ error: 'Ошибка сервера при получении данных чата' });
    }
});


module.exports = ChatRoutes;