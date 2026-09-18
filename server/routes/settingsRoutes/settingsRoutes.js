const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');


// Импорт базы данных
const client = require('../../config/db');

// Email utility
const { sendConfirmationCode } = require('../../utils/nodemailer/nodemailer.js');

// MIDLEWARE
const { verifyToken } = require('../../middleware/authMiddleware'); // Проверка токена
const checkBlockStatusWithoutToken = require('../../middleware/MarketMiddleware/checkBlockStatusWithoutToken'); //проверка юзера на блокировку
const optionalAuth = require('../../middleware/MarketMiddleware/optionalAuth'); //Проверка в куки токен

// API роут для настроек (почта, смена пароль, удаление аккаунта)
router.get('/get', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Используем async/await для запроса к базе данных
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);

    // 2. Проверяем, найден ли пользователь
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // 3. Приравниваем данные к объекту user
    const user = result.rows[0];

    // 4. Отправляем объект user клиенту в формате JSON
    res.json(user);

  } catch (error) {
    console.error('Ошибка при получении настроек:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// API роут для изменения настроек пользователя
router.post('/request-confirmation', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { action, currentPassword, newEmail } = req.body;
//   console.log(`[REQUEST] Запрос на подтверждение от пользователя ${userId} для действия: ${action}`);

  try {
    // console.log(`[DB] Поиск пользователя с ID: ${userId}`);
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const user = result.rows[0];
    // console.log(`[SUCCESS] Пользователь ${user.email} найден.`);

    // Проверка пароля
    // console.log('[AUTH] Проверка текущего пароля...');
    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }
    // console.log(`[AUTH] Пароль пользователя ${user.email} подтвержден.`);

    if (action === 'changeEmail') {
        // Если новый email совпадает со старым
        if (newEmail === user.email) {
            return res.status(409).json({ message: 'Новый email не должен совпадать с текущим.' });
        }

        // ✅ 2. ПРОВЕРКА НА УНИКАЛЬНОСТЬ
        const emailExists = await client.query('SELECT 1 FROM users WHERE email = $1', [newEmail]);
        if (emailExists.rowCount > 0) {
            return res.status(409).json({ message: 'Этот email уже используется другим пользователем.' });
        }
    }

    // Генерируем код
    const code = crypto.randomInt(100000, 1000000).toString();
    // console.log(`[CODEGEN] Сгенерирован код: ${code}`);

    // Сохраняем в БД (таблица confirmations: userId, action, code, expiresAt)
    // console.log(`[DB] Сохранение кода для действия '${action}' пользователя ${userId}...`);
    await client.query(
      'INSERT INTO confirmations (user_id, action, code, expires_at) VALUES ($1, $2, $3, NOW() + interval \'10 minutes\')',
      [userId, action, code]
    );

    const actionText = {
        'changeEmail': 'смены почты',
        'changePassword': 'смены пароля',
        'deleteAccount': 'удаления аккаунта'
    } [action] || 'подтверждения действия';

    const emailSubject = `Код подтверждения для ${actionText} на Pl_Gl-new-market`;
    const emailText = `Здравствуйте!

    Вы запросили код подтверждения для ${actionText} на сайте Pl_Gl-new-market.

    Ваш код подтверждения: ${code}

    Срок действия кода: 10 минут.
    Если вы не запрашивали этот код, просто проигнорируйте это письмо.

    С уважением,
    Команда Pl_Gl-new-market`;

    // Организуем отправку кода на email
    // console.log(`[EMAIL] Попытка отправки письма на ${user.email}...`);
    const emailResult = await sendConfirmationCode(user.email, code, emailSubject, emailText);

    if (emailResult.success) {
    //   console.log(`[SUCCESS] Код подтверждения успешно отправлен на ${user.email}.`);
      return res.json({ message: 'Код подтверждения отправлен на вашу почту.' });
    } else {
      console.error(`[ERROR] Не удалось отправить код на ${user.email}.`);
      return res.status(500).json({ message: 'Не удалось отправить код подтверждения.' });
    }

  } catch (error) {
    console.error('Ошибка при запросе подтверждения:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


// API-роут для подтверждения действий (удаление аккаунта, смена почты, смена пароля)
router.post('/confirm', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { action, code, newEmail, newPassword } = req.body;

//   console.log(`[REQUEST] Запрос на подтверждение от пользователя ${userId} для действия: ${action}`);

  try {

    // console.log(`[DB] Поиск кода подтверждения для пользователя ${userId}...`);
    const result = await client.query(
      'SELECT * FROM confirmations WHERE user_id = $1 AND action = $2 AND code = $3 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [userId, action, code]
    );

    if (result.rows.length === 0) {
        // console.log(`[ERROR] Неверный или просроченный код для пользователя ${userId}.`);
        await client.query('DELETE FROM confirmations WHERE user_id = $1 AND action = $2', [userId, action]);
        return res.status(400).json({ message: 'Неверный или просроченный код' });
    }
    
    // console.log(`[SUCCESS] Код подтверждения для пользователя ${userId} найден и верен.`);


    // В зависимости от действия
    if (action === 'deleteAccount') {
        // console.log(`[ACTION] Удаление аккаунта пользователя ${userId}...`);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
    //   console.log(`[SUCCESS] Аккаунт пользователя ${userId} успешно удалён.`);
      res.json({ message: 'Аккаунт удалён' });
    }

    if (action === 'changeEmail') {
    //   console.log(`[ACTION] Смена email для пользователя ${userId} на ${newEmail}...`);
      await client.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, userId]);
    //   console.log(`[SUCCESS] Email пользователя ${userId} успешно обновлён.`);
      res.json({ message: 'Email обновлён' });
    }

    if (action === 'changePassword') {
    //   console.log(`[ACTION] Смена пароля для пользователя ${userId}...`);
      const hashed = await bcrypt.hash(newPassword, 10);
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashed, userId]);
    //   console.log(`[SUCCESS] Пароль пользователя ${userId} успешно обновлён.`);
      res.json({ message: 'Пароль обновлён' });
    }

     // После успешного действия — удаляем подтверждение
    // console.log(`[DB] Удаление записи о подтверждении для пользователя ${userId}...`);
    await client.query('DELETE FROM confirmations WHERE user_id = $1 AND action = $2', [userId, action]);
    // console.log(`[DB] Запись о подтверждении успешно удалена.`);

  } catch (error) {
    console.error('Ошибка при подтверждении:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});


module.exports = router;
