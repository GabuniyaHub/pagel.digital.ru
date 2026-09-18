const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const fs = require('fs');

// Импорт базы данных
const client = require('../../config/db');

// MIDLEWARE
const { verifyToken } = require('../../middleware/authMiddleware'); // Проверка токена
const checkBlockStatusWithoutToken = require('../../middleware/MarketMiddleware/checkBlockStatusWithoutToken'); //проверка юзера на блокировку
const optionalAuth = require('../../middleware/MarketMiddleware/optionalAuth'); //Проверка в куки токен

// MULTER  
const upload = require('../../config/multer/multer'); // Импорт multer для загрузки файлов
const { Client } = require('pg');
router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

router.post('/logout', (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    });
    res.json({ success: true });
});


// ROUTES PRIVATE
// API-роут для получения страницы аккаунта
router.get('/', verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/pages/account/account.html'));
});

// API-роут для получения данных аккаунта
router.get('/get/data', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const listingsResult = await client.query('SELECT * FROM listings WHERE user_id = $1', [userId]);
        const reviewsResult = await client.query('SELECT * FROM reviews WHERE user_id = $1', [userId]);
        const favoritesResult = await client.query('SELECT * FROM favorites WHERE user_id = $1', [userId]);
        const categoriesResult = await client.query('SELECT * FROM categories');
        const platformsResult = await client.query('SELECT * FROM platforms');

        const user = userResult.rows[0]; // только один пользователь
        const listings = listingsResult.rows;
        const reviews = reviewsResult.rows;
        const favorites = favoritesResult.rows;
        const categories = categoriesResult.rows;
        const platforms = platformsResult.rows;

        res.json({ user, listings, reviews, favorites, categories, platforms });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API-роут для сохранения настроек аккаунта
router.post('/save-settings', verifyToken, upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { nickname, description, contacts } = req.body;
        let avatar = req.file ? `/market/uploads/avatars/custom/${req.file.filename}` : req.body.avatar; // путь к файлу

        if (!nickname || !description || !contacts) {
            return res.status(400).json({ error: 'Пожалуйста, заполните все поля' });
        }

        // Проверка контактов
        let parsedContacts = {};
        try {
          parsedContacts = JSON.parse(contacts);
        } catch (e) {
          console.warn('Ошибка парсинга контактов', e);
          return res.status(400).json({ message: 'Неверный формат контактов' });
        }

        // Обновление данных пользователя
        await client.query(
            'UPDATE users SET nickname = $1, description = $2, avatar = $3, contacts = $4 WHERE id = $5',
            [nickname, description, avatar, contacts, userId]
        );

        res.json({ message: 'Настройки успешно сохранены' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ROUTES PUBLIC
// API-роут для получения публичного профиля пользователя
router.get('/public/:userId', checkBlockStatusWithoutToken, async (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/pages/account/accountPublic.html'));
});

// API-роут для отображения публичного профиля пользователя (EJS) без проверки токена
router.get('/public/get/:userId', checkBlockStatusWithoutToken, async (req, res) => {
    try {
        const userId = req.params.userId;

        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const listingsResult = await client.query('SELECT * FROM listings WHERE user_id = $1', [userId]);
        const reviewsResult = await client.query('SELECT * FROM reviews WHERE user_id = $1', [userId]);
        const favoritesResult = await client.query('SELECT * FROM favorites WHERE user_id = $1', [userId]);
        const categoriesResult = await client.query('SELECT * FROM categories');
        const platformsResult = await client.query('SELECT * FROM platforms');

        const user = userResult.rows[0]; // только один пользователь
        const listings = listingsResult.rows;
        const reviews = reviewsResult.rows;
        const favorites = favoritesResult.rows;
        const categories = categoriesResult.rows;
        const platforms = platformsResult.rows;

        res.json({ user, listings, reviews, favorites, categories, platforms });
        

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


module.exports = router;
