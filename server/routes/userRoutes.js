const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const client = require("../config/db");
const { OAuth2Client } = require('google-auth-library');
const googleAuthClient = new OAuth2Client({
    clientId: '293649929067-v7prhbomfisdih5868evj6e66p6r42em.apps.googleusercontent.com',
    clientSecret: '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',
    redirectUri: 'https://www.pagel-digital.ru/auth/callback',
});
// const { OAuth2Client } = require('google-auth-library');
const { parse } = require("url");
const dotenv = require("dotenv");
const { Client } = require("pg");


const SECRET_KEY = process.env.JWT_SECRET || "guram"; //JWT
const failedAttempts = new Map(); // Хранит количество неудачных попыток для каждого email
const blockedUsers = new Map();  // Хранит время разблокировки для каждого email
const verificationCodes = new Map(); // Временное хранилище кодов

const { verifyToken } = require("../middleware/authMiddleware");
const checkBlockStatus = require("../middleware/UsersAutharizationMiddleware/checkBlockStatus");
const { serveStaticFile } = require("../utils/staticFileHandler");
const { application } = require('express');
const { json } = require('body-parser');

// const express = require("express");
// const app = express();
// app.use(express.json());

function userRouters(req, res) {
    // app.use(express.static(path.join(__dirname, "../client")));

    if (req.method === 'POST' && req.url === "/api/reg") { //api/reg
        console.log("Получен POST-запрос на /api/reg");
        const { pathname } = parse(req.url, true);
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", async () => {
            const { name, email, password } = JSON.parse(body);
            try {
                console.log("Данные, полученные от клиента:", body);

                // Проверка на пустые поля
                if (!name || !email || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Все поля обязательны" }));
                }

                // Хешируем пароль
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // SQL-запрос на добавление пользователя
                const query = `
                        INSERT INTO users (nickname, email, password_hash)
                        VALUES ($1, $2, $3)
                        RETURNING id;
                    `;

                const result = await client.query(query, [name, email, hashedPassword]);
                console.log("Пользователь успешно зарегистрирован:", result.rows[0]);

                // Проверка блокировки пользователя администратором (из базы данных)
                // const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
                // const blockedResult = await client.query(checkBlockedQuery, [user.id]);
                // const isBlockedFromDb = blockedResult.rows[0].is_blocked;

                // if (isBlockedFromDb) {
                //     res.writeHead(403, { "Content-Type": "application/json" });
                //     return res.end(JSON.stringify({
                //         success: false,
                //         message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
                //     }));
                // }

                // Генерация JWT токена
                const token = jwt.sign(
                    { userId: result.rows[0].id, email: result.rows[0].email },
                    SECRET_KEY, // Замените на ваш секретный ключ
                    { expiresIn: '30d' } // Токен будет действителен 7 d
                );

                console.log("Фактический SECRET_KEY (reg):", SECRET_KEY);
                console.log("Длина ключа (reg):", SECRET_KEY.length);

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    success: true,
                    message: "Пользователь зарегистрирован.",
                    userId: result.rows[0].id,
                    token: token
                }));
            } catch (err) {
                console.error("Ошибка при регистрации:", err);

                if (err.code === '23505') { // Ошибка уникальности
                    res.writeHead(400, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, message: "Пользователь с таким email или никнеймом уже существует" }));
                } else {
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: false, message: "Ошибка сервера" }));
                }
            }
        });
    } else if (req.method === 'POST' && req.url === "/api/send-code") { //api/send-code
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            const { email } = JSON.parse(body);

            if (!email) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Email обязателен" }));
            }

            // Генерация 6-значного кода
            const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
            verificationCodes.set(email, confirmationCode); // Сохраняем код

            // Отправка кода через nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: 'pageldigitaleu@gmail.com', pass: 'ldsb scmr bris joja' }
            });

            const mailOptions = {
                from: 'pageldigitaleu@gmail.com',
                to: email,
                subject: 'Код подтверждения',
                text: `Ваш код подтверждения: ${confirmationCode}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Ошибка при отправке кода.", error);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Ошибка при отправке кода" }));
                } else {
                    console.log("Код на email отправлен:", info.response);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: true, message: "Код отправлен" }));
                }
            });
        });
    } else if (req.method === 'POST' && req.url === "/api/verify-code") { //api/verify-code
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            const { email, code } = JSON.parse(body);

            if (!email || !code) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Все поля обязательны" }));
            }

            const storedCode = verificationCodes.get(email);
            if (storedCode && storedCode === code) {
                verificationCodes.delete(email); // Удаляем использованный код

                // Обновление статуса в БД
                await client.query("UPDATE users SET verified = TRUE WHERE email = $1", [email]);

                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: true, message: "Email подтвержден!" }));
            }

            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Неверный код" }));
        });
    } else if (req.method === 'POST' && req.url === "/api/check-email") { //api/check-email
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            const { email } = JSON.parse(body);

            if (!email) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Email обязателен" }));
            }

            try {
                // Проверка уникальности email
                const checkEmailQuery = `SELECT * FROM users WHERE email = $1`;
                const emailCheckResult = await client.query(checkEmailQuery, [email]);

                if (emailCheckResult.rows.length > 0) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Пользователь с таким email уже существует" }));
                }

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, message: "Email свободен" }));
            } catch (err) {
                console.error("Ошибка при проверке email:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Ошибка сервера" }));
            }
        });
    } else if (req.method === 'POST' && req.url === "/api/log") { //api/log
        console.log("Получен POST-запрос на /api/log:");
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", async () => {
            try {
                const { email, password } = JSON.parse(body);
                console.log("Данные для входа: ", { email });

                if (!email || !password) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Все поля обязательны!" }));
                }

                // Проверяем, есть ли пользователь в базе
                const userQuery = `SELECT id, nickname, email, password_hash FROM users WHERE email = $1`;
                const userResult = await client.query(userQuery, [email]);

                if (userResult.rows.length === 0) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Неверный Email или пароль!" }));
                }

                const user = userResult.rows[0];

                // Проверяем пароль
                const isPasswordValid = await bcrypt.compare(password, user.password_hash);
                if (!isPasswordValid) {
                    res.writeHead(401, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ message: "Неверный Email или пароль!" }));
                }

                // Проверяем, заблокирован ли пользователь (проверка именно если пользователь ввел неправильно пароль несколько раз)
                if (blockedUsers.has(email)) {
                    const unblockTime = blockedUsers.get(email);
                    if (Date.now() < unblockTime) {
                        const remainingTime = Math.ceil((unblockTime - Date.now()) / 1000 / 60); // Оставшееся время в минутах
                        res.writeHead(403, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: false,
                            message: `Доступ заблокирован. Попробуйте снова через ${remainingTime} минут.`
                        }));
                    } else {
                        // Разблокируем пользователя, если время блокировки истекло
                        blockedUsers.delete(email);
                        failedAttempts.delete(email);
                    }
                }

                // Проверка блокировки пользователя администратором (из базы данных)
                const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
                const blockedResult = await client.query(checkBlockedQuery, [user.id]);
                const isBlockedFromDb = blockedResult.rows[0].is_blocked;

                if (isBlockedFromDb) {
                    res.writeHead(403, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({
                        success: false,
                        message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
                    }));
                }

                // Всегда отправляем код подтверждения
                const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
                verificationCodes.set(email, confirmationCode); // Сохраняем код

                // console.log(confirmationCode);

                // Отправка кода через nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: 'pageldigitaleu@gmail.com', pass: 'ldsb scmr bris joja' }
                });

                const mailOptions = {
                    from: 'pageldigitaleu@gmail.com',
                    to: email,
                    subject: 'Код подтверждения',
                    text: `Ваш код подтверждения: ${confirmationCode}`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Ошибка при отправке кода.", error);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ success: false, message: "Ошибка при отправке кода" }));
                    } else {
                        console.log("Код на email отправлен:", info.response);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: true,
                            message: "Код подтверждения отправлен на ваш email",
                            requiresConfirmation: true // Указываем, что требуется подтверждение
                        }));
                    }
                });
            } catch (err) {
                console.error("Ошибка при входе: ", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Ошибка сервера!" }));
            }
        });
    } else if (req.method === 'POST' && req.url === "/api/forgot-password") { //api/forgot-password
        console.log("Получен запрос на /api/forgot-password");
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
            console.log("Получены данные:", body);
        });

        req.on("end", async () => {
            try {
                console.log("Обработка запроса...");
                const { email } = JSON.parse(body);
                console.log("Email:", email);

                if (!email) {
                    console.log("Email не предоставлен");
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Email обязателен" }));
                }

                // Проверяем, существует ли пользователь с таким email
                const userQuery = `SELECT id FROM users WHERE email = $1`;
                console.log("Выполнение запроса к базе данных...");
                const userResult = await client.query(userQuery, [email]);

                if (userResult.rows.length === 0) {
                    console.log("Пользователь не найден");
                    res.writeHead(404, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Пользователь с таким email не найден" }));
                }

                // Генерация 6-значного кода
                const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
                verificationCodes.set(email, resetCode); // Сохраняем код
                console.log("Код подтверждения сгенерирован:", resetCode);

                // Отправка кода через nodemailer
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: 'pageldigitaleu@gmail.com', pass: 'ldsb scmr bris joja' }
                });

                const mailOptions = {
                    from: 'pageldigitaleu@gmail.com',
                    to: email,
                    subject: 'Код для сброса пароля',
                    text: `Ваш код для сброса пароля: ${resetCode}`
                };

                console.log("Отправка email...");
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error("Ошибка при отправке кода:", error);
                        res.writeHead(500, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ success: false, message: "Ошибка при отправке кода" }));
                    } else {
                        console.log("Код на email отправлен:", info.response);
                        res.writeHead(200, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ success: true, message: "Код для сброса пароля отправлен на ваш email" }));
                    }
                });
            } catch (err) {
                console.error("Ошибка при обработке запроса:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Ошибка сервера" }));
            }
        });
    } else if (req.method === 'POST' && req.url === "/api/reset-password") { //api/reset-password
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            const { email, code, newPassword } = JSON.parse(body);

            if (!email || !code || !newPassword) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Все поля обязательны" }));
            }

            // Проверяем код
            const storedCode = verificationCodes.get(email);
            if (storedCode && storedCode === code) {
                verificationCodes.delete(email); // Удаляем использованный код

                // Хэшируем новый пароль
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Обновляем пароль в базе данных
                const updateQuery = `UPDATE users SET password_hash = $1 WHERE email = $2`;
                await client.query(updateQuery, [hashedPassword, email]);

                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: true, message: "Пароль успешно изменен!" }));
            }

            res.writeHead(400, { "Content-Type": "application/json" });
            return res.end(JSON.stringify({ success: false, message: "Неверный код" }));
        });
    } else if (req.method === 'POST' && req.url === "/api/verify-reset-code") { //api/verify-reset-code
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            const { email, code } = JSON.parse(body);

            if (!email || !code) {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Все поля обязательны" }));
            }

            // Проверяем код
            const storedCode = verificationCodes.get(email);
            if (storedCode && storedCode === code) {
                res.writeHead(200, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: true, message: "Код подтвержден" }));
            } else {
                res.writeHead(400, { "Content-Type": "application/json" });
                return res.end(JSON.stringify({ success: false, message: "Неверный код" }));
            }
        });
    } else if (req.method === 'POST' && req.url === "/api/verify-code-login") { //verify-code-login
        let body = "";
        req.on("data", chunk => { body += chunk.toString(); });

        req.on("end", async () => {
            try {
                const { email, code } = JSON.parse(body);

                if (!email || !code) {
                    res.writeHead(400, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({ success: false, message: "Все поля обязательны" }));
                }

                // Проверяем, заблокирован ли пользователь
                if (blockedUsers.has(email)) {
                    const unblockTime = blockedUsers.get(email);
                    if (Date.now() < unblockTime) {
                        const remainingTime = Math.ceil((unblockTime - Date.now()) / 1000 / 60); // Оставшееся время в минутах
                        res.writeHead(403, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: false,
                            message: `Доступ заблокирован. Попробуйте снова через ${remainingTime} минут.`
                        }));
                    } else {
                        // Разблокируем пользователя, если время блокировки истекло
                        blockedUsers.delete(email);
                        failedAttempts.delete(email);
                    }
                }

                const storedCode = verificationCodes.get(email);
                if (storedCode && storedCode === code) {
                    // Сбрасываем счетчик неудачных попыток и удаляем код
                    verificationCodes.delete(email);
                    failedAttempts.delete(email);

                    // Подключаемся к базе данных, если не подключены
                    if (!client._connected) {
                        await client.connect();
                    }

                    // Получаем пользователя из базы данных
                    const result = await client.query("SELECT id, nickname, email FROM users WHERE email = $1", [email]);

                    if (result.rows.length === 0) {
                        res.writeHead(404, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ success: false, message: "Пользователь не найден" }));
                    }

                    // Проверка блокировки пользователя администратором (из базы данных)
                    const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
                    const blockedResult = await client.query(checkBlockedQuery, [result.rows[0].id]);
                    const isBlockedFromDb = blockedResult.rows[0].is_blocked;

                    if (isBlockedFromDb) {
                        res.writeHead(403, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: false,
                            message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
                        }));
                    }

                    const user = result.rows[0]; // Теперь у нас есть user
                    // console.log('osijcaoseijos', user);

                    // Генерация токена
                    const token = jwt.sign(
                        { userId: user.id, email: user.email },
                        SECRET_KEY,
                        { expiresIn: "30d" }
                    );

                    // console.log("Фактический SECRET_KEY (log):", SECRET_KEY);
                    // console.log("Длина ключа: (log)", SECRET_KEY.length);

                    // console.log('токен передается с сервера:', token)

                    res.writeHead(200, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({
                        success: true,
                        token,
                        message: "Вход выполнен успешно!",
                        userId: user.id,
                        name: user.nickname,
                        email: user.email
                    }));
                } else {
                    // Увеличиваем счетчик неудачных попыток
                    const attempts = failedAttempts.get(email) || 0;
                    failedAttempts.set(email, attempts + 1);

                    if (attempts + 1 >= 3) {
                        // Блокируем пользователя на 15 минут
                        const blockTime = Date.now() + 15 * 60 * 1000; // 15 минут
                        blockedUsers.set(email, blockTime);

                        res.writeHead(403, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: false,
                            message: "Превышено количество попыток. Доступ заблокирован на 15 минут."
                        }));
                    } else {
                        res.writeHead(400, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({
                            success: false,
                            message: `Неверный код. Осталось попыток: ${3 - (attempts + 1)}`
                        }));
                    }
                }
            } catch (err) {
                console.error("Ошибка при обработке запроса:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, message: "Внутренняя ошибка сервера" }));
            }
        });
    } else if (req.method === 'GET' && req.url === "/api/profile") { //api/profile
        verifyToken(req, res, async () => { //Сначала проверяем токен
            checkBlockStatus(req, res, async () => { // Затем проверяем статус блокировки
                try {
                    const userQuery = `SELECT id, nickname, email FROM users WHERE id = $1`;
                    const userResult = await client.query(userQuery, [req.user.userId]);

                    if (userResult.rows.length === 0) {
                        res.writeHead(404, { "Content-Type": "application/json" });
                        return res.end(JSON.stringify({ message: "Пользователь не найден." }));
                    }

                    const user = userResult.rows[0];
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Пользователь не найден." }));
                } catch (err) {
                    console.error("Ошибка при получении профиля:", err);
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ message: "Ошибка сервера!" }));
                }
            });
        });
    } else if (req.method === "GET" && req.url === "/") { //http://PL-GL.ru/
        const filePath = path.join(__dirname, "../../client/pages/lending/lending.html");
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Ошибка при загрузке страницы");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
        });
    } else if (req.method === 'POST' && req.url === '/auth/google') { //api/google
        let body = '';

        // Собираем тело запроса
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        // Когда тело запроса полностью получено
        req.on('end', async () => {
            try {
                const { credential } = JSON.parse(body);

                console.log('Получен запрос на /auth/google');
                console.log('Токен от Google:', credential);

                // Проверка токена Google
                console.log('Начинаем проверку токена Google...');
                const ticket = await googleAuthClient.verifyIdToken({
                    idToken: credential,
                    audience: '293649929067-v7prhbomfisdih5868evj6e66p6r42em.apps.googleusercontent.com',
                });

                console.log('Токен успешно проверен Google');
                const payload = ticket.getPayload();

                // Проверка срока действия токена
                const currentTime = Math.floor(Date.now() / 1000);
                if (payload.exp && currentTime > payload.exp) {
                    console.error('Токен истёк');
                    return res.status(400).json({ success: false, message: 'Токен истёк' });
                }

                console.log('Данные пользователя от Google:', {
                    email: payload.email,
                    name: payload.name,
                    googleId: payload.sub,
                    avatar: payload.picture,
                });

                const { email, name, sub: googleId } = payload;

                // Проверка, есть ли пользователь в базе данных
                console.log('Проверяем, есть ли пользователь в базе данных...');
                const userQuery = await client.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [googleId, email]);

                console.log('Результат запроса к базе данных:', userQuery.rows);
                let user;

                if (userQuery.rows.length === 0) {
                    // Создаем нового пользователя
                    console.log('Пользователь не найден. Создаем нового...');
                    const newUser = await client.query(
                        `INSERT INTO users (nickname, email, google_id, avatar, description, password_hash)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *`,
                        [name, email, googleId, payload.picture || 'DEFAULT_AVATAR_URL', '', '']
                    );

                    user = newUser.rows[0];
                    console.log('Новый пользователь создан:', user);
                } else {
                    // Пользователь уже существует
                    console.log('Пользователь уже существует:', userQuery.rows[0]);
                    user = userQuery.rows[0];
                }

                // Проверка блокировки пользователя администратором (из базы данных)
                const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
                const blockedResult = await client.query(checkBlockedQuery, [user.id]);
                const isBlockedFromDb = blockedResult.rows[0].is_blocked;

                if (isBlockedFromDb) {
                    res.writeHead(403, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({
                        success: false,
                        message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
                    }));
                }

                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    SECRET_KEY,
                    { expiresIn: '30d' } // Токен будет действителен 7 d
                );

                // Возвращаем данные пользователя и токен Google
                console.log('Отправляем ответ клиенту:', { success: true, user, token: credential });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Регистрация пройдена!',
                    user,
                    token
                }));
            } catch (error) {
                console.error('Ошибка:', error);
                console.error('Стек ошибки:', error.stack);

                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Ошибка авторизации' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/auth/vk') {
        let body = '';

        // Собираем тело запроса
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        // Когда тело запроса полностью получено
        req.on('end', async () => {
            try {
                const { authToken, email, user_id } = JSON.parse(body);

                console.log('Получен запрос на /auth/vk');
                console.log('Токен от VK:', authToken);
                console.log('Email от VK:', email);
                console.log('User ID от VK:', user_id);

                // Проверка токена VK через API
                console.log('Начинаем проверку токена VK...');
                const vkResponse = await axios.get(
                    `https://api.vk.com/method/users.get?access_token=${authToken}&v=5.131`
                );

                console.log('Ответ от VK API:', vkResponse.data);

                if (vkResponse.data.error) {
                    console.error('Ошибка проверки токена VK:', vkResponse.data.error);
                    return res.status(400).json({ success: false, message: 'Неверный токен VK' });
                }

                const vkUser = vkResponse.data.response[0];
                console.log('Данные пользователя от VK:', {
                    firstName: vkUser.first_name,
                    lastName: vkUser.last_name,
                    vkId: user_id,
                    email: email
                });

                // Формируем имя пользователя
                const name = `${vkUser.first_name} ${vkUser.last_name}`;

                // Проверка, есть ли пользователь в базе данных
                console.log('Проверяем, есть ли пользователь в базе данных...');
                const userQuery = await client.query(
                    'SELECT * FROM users WHERE vk_id = $1 OR email = $2',
                    [user_id, email]
                );

                console.log('Результат запроса к базе данных:', userQuery.rows);
                let user;

                if (userQuery.rows.length === 0) {
                    // Создаем нового пользователя
                    console.log('Пользователь не найден. Создаем нового...');
                    const newUser = await client.query(
                        `INSERT INTO users (nickname, email, vk_id, avatar, description, password_hash)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING *`,
                        [name, email, user_id, vkUser.photo_100 || 'DEFAULT_AVATAR_URL', '', '']
                    );

                    user = newUser.rows[0];
                    console.log('Новый пользователь создан:', user);
                } else {
                    // Пользователь уже существует
                    console.log('Пользователь уже существует:', userQuery.rows[0]);
                    user = userQuery.rows[0];

                    // Обновляем vk_id если его не было
                    if (!user.vk_id) {
                        await client.query(
                            'UPDATE users SET vk_id = $1 WHERE id = $2',
                            [user_id, user.id]
                        );
                        user.vk_id = user_id;
                    }
                }

                // Проверка блокировки пользователя администратором
                const checkBlockedQuery = `SELECT is_blocked FROM users WHERE id = $1`;
                const blockedResult = await client.query(checkBlockedQuery, [user.id]);
                const isBlockedFromDb = blockedResult.rows[0].is_blocked;

                if (isBlockedFromDb) {
                    res.writeHead(403, { "Content-Type": "application/json" });
                    return res.end(JSON.stringify({
                        success: false,
                        message: "Ваш аккаунт заблокирован. Свяжитесь с plgl@gmail.com"
                    }));
                }

                // Генерируем JWT токен
                const token = jwt.sign(
                    { userId: user.id, email: user.email },
                    SECRET_KEY,
                    { expiresIn: '30d' }
                );

                // Возвращаем данные пользователя и токен
                console.log('Отправляем ответ клиенту');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Авторизация через VK успешна!',
                    user: {
                        id: user.id,
                        email: user.email,
                        nickname: user.nickname,
                        avatar: user.avatar
                    },
                    token
                }));
            } catch (error) {
                console.error('Ошибка:', error);
                console.error('Стек ошибки:', error.stack);

                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    message: 'Ошибка авторизации через VK'
                }));
            }
        });
    } else {
        serveStaticFile(req, res); // Обрабатываем статические файлы
    }  //14 маршрутов 
}

module.exports = { userRouters };
