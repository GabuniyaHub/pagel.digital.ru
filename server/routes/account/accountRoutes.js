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
const uploadProfileAvatar = require('../../config/multer/profileAvatar');
router.post('/upload', verifyToken, upload.single('file'), (req, res) => {
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
router.get('/session', optionalAuth, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    if (!req.user) return res.json({ user: null });
    try {
        const { rows } = await client.query('SELECT id, nickname, avatar, is_premium, verified, is_blocked FROM users WHERE id=$1', [req.user.id]);
        const user = rows[0];
        if (user && !user.is_blocked && req.headers.authorization?.startsWith('Bearer ')) {
            res.cookie('jwt', req.headers.authorization.slice(7), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
        }
        res.json({ user: user && !user.is_blocked ? user : null });
    } catch { res.status(503).json({ error: 'Не удалось проверить вход. Попробуйте позже.' }); }
});
// API-роут для получения страницы аккаунта
// JWT из localStorage нельзя приложить к обычной навигации браузера. Сам шаблон
// не содержит приватных данных: их защищает /get/data ниже.
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/pages/account/pl-gl-personal-account.html'));
});

// API-роут для получения данных аккаунта
router.get('/get/data', verifyToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Пользователь не авторизован' });
        }
        const userResult = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
        const listingsResult = await client.query(
            `SELECT * FROM listings
             WHERE user_id = $1
             ORDER BY is_pinned DESC, position DESC, COALESCE(up_date, created_at) DESC`,
            [userId]
        );
        const reviewsResult = await client.query(
            `SELECT reviews.*, authors.nickname AS author_name
             FROM reviews
             LEFT JOIN users AS authors ON authors.id = reviews.author_id
             WHERE reviews.user_id = $1
             ORDER BY reviews.review_date DESC`,
            [userId]
        );
        const favoritesResult = await client.query('SELECT * FROM favorites WHERE user_id = $1', [userId]);
        const dealsResult = await client.query(
            `SELECT deals.*, listings.name AS listing_name,
                    CASE WHEN deals.seller_id = $1 THEN 'seller' ELSE 'buyer' END AS user_role
             FROM deals
             LEFT JOIN listings ON listings.id = deals.listing_id
             WHERE deals.buyer_id = $1 OR deals.seller_id = $1
             ORDER BY deals.created_at DESC`,
            [userId]
        );
        const categoriesResult = await client.query('SELECT * FROM categories');
        const platformsResult = await client.query('SELECT * FROM platforms');

        const user = userResult.rows[0]; // только один пользователь
        const listings = listingsResult.rows;
        const reviews = reviewsResult.rows;
        const favorites = favoritesResult.rows;
        const deals = dealsResult.rows;
        const categories = categoriesResult.rows;
        const platforms = platformsResult.rows;

        res.json({ user, listings, reviews, favorites, deals, categories, platforms });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// API-роут для сохранения настроек аккаунта
router.post('/save-settings', verifyToken, uploadProfileAvatar, async (req, res) => {
    const cleanup = async () => { if (req.file) await fs.promises.unlink(req.file.path).catch(() => {}); };
    try {
        const nickname = typeof req.body.nickname === 'string' ? req.body.nickname.trim() : '';
        const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
        let contacts;
        try { contacts = JSON.parse(req.body.contacts); } catch { contacts = null; }
        if (!nickname || nickname.length > 50 || description.length > 125 || !contacts || typeof contacts !== 'object' || Array.isArray(contacts)) {
            await cleanup();
            return res.status(400).json({ error: 'Проверьте имя, описание и контакты.' });
        }
        contacts = Object.fromEntries(['telegram', 'email', 'whatsapp'].map(name => [name, typeof contacts[name] === 'string' ? contacts[name].trim() : '']));
        contacts.telegram = contacts.telegram.replace(/^https?:\/\/(?:www\.)?t\.me\//i, '').replace(/^@/, '');
        if (!Object.values(contacts).some(Boolean)
            || (contacts.telegram && !/^[a-zA-Z0-9_]{5,32}$/.test(contacts.telegram))
            || (contacts.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacts.email))
            || (contacts.whatsapp && !/^\+?[0-9\s\-()]{7,20}$/.test(contacts.whatsapp))) {
            await cleanup();
            return res.status(400).json({ error: 'Укажите корректный Telegram, email или WhatsApp.' });
        }
        const avatar = req.file ? '/market/uploads/avatars/custom/' + req.file.filename : null;
        const result = await client.query(
            'UPDATE users SET nickname = $1, description = $2, avatar = COALESCE($3, avatar), contacts = $4::jsonb WHERE id = $5 RETURNING id, nickname, description, avatar, contacts, verified, is_premium',
            [nickname, description, avatar, JSON.stringify(contacts), req.user.id]
        );
        if (!result.rows[0]) { await cleanup(); return res.status(404).json({ error: 'Профиль не найден.' }); }
        await require('../../services/notifications').create(req.user.id, {
            title: 'Профиль обновлён', message: 'Изменения профиля и контактов сохранены.', url: '/account#settings'
        }).catch(error => console.error('Profile notification:', error));
        res.json({ message: 'Настройки сохранены', user: result.rows[0] });
    } catch (err) {
        await cleanup();
        console.error('Ошибка сохранения профиля:', err);
        res.status(err.code === '23505' ? 409 : 500).json({ error: err.code === '23505' ? 'Это имя уже занято.' : 'Не удалось сохранить профиль.' });
    }
});

// ROUTES PUBLIC
// API-роут для получения публичного профиля пользователя
router.get('/public/:userId', checkBlockStatusWithoutToken, async (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/pages/account/pl-gl-public-profile.html'));
});

// API-роут для отображения публичного профиля пользователя (EJS) без проверки токена
router.get('/public/get/:userId', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
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
