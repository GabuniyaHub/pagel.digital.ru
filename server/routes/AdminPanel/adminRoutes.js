const client = require("../../config/db");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sendmailer = require("../../utils/adminpanel/sendmailer"); //  модуль отправки писем
const transporter = require("./../../utils/adminpanel/sendmailer");
const { storeCode, getCode, clearCode } = require("../../utils/adminpanel/verificationCodes"); // временное хранилище кодов
// const { Client } = require("pg");

// Разрешённые email'ы для админов
const SECRET_KEY = process.env.JWT_SECRET || "guram";
// const allowedAdmins = ["fox78907864@gmail.com"];

// 📩 Отправка кода
router.post("/send-admin", async (req, res) => {
  const { email } = req.body;

    try {
        const result = await client.query("SELECT email FROM admins WHERE email = $1", [email]);
        const allowedAdminsFromDb = result.rows.map((row) => row.email);        
        
        if (!allowedAdminsFromDb.includes(email)) {
            return res.status(403).json({ message: "Доступ запрещён" });
          }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        storeCode(email, code);

        const mailOptions = {
            from: "bebrikivan199@gmail.com",
            to: email,
            subject: "Код подтверждения для входа в админ-панель",
            text: `Ваш код подтверждения: ${code}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            console.error("Ошибка при отправке:", error);  // Логируем ошибку
            return res.status(500).json({ success: false, message: "Ошибка при отправке письма", error: error });
            } else {
            console.log("Письмо отправлено:", info.response);
            return res.status(200).json({ success: true, message: "Код отправлен" });
            }
        });
    } catch (error) {
        console.error("Ошибка при запросе администраторов:", error);
        return res.status(500).json({ message: "Ошибка сервера при проверке администратора" });
      }
});

// ✅ Подтверждение кода и выдача JWT
router.post("/verify-admin", (req, res) => {
    const { email, code } = req.body;
  
    console.log("Полученные данные:", { email, code });  // Логируем данные
  
    if (getCode(email) !== code) {
      console.log("Неверный код");  // Логируем ошибку, если код не совпадает
      return res.status(400).json({ message: "Неверный код" });
    }
  
    clearCode(email);
  
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
  
    console.log("JWT токен выдан:", token);  // Логируем успешное создание токена
  
    res.status(200).json({ token });
  });
  
// GET /api/admin/users
router.get("/admin/users", async (req, res) => {
    try {
      const result = await client.query("SELECT id, email FROM users");
      res.json(result.rows);
    } catch (error) {
      console.error("Ошибка при получении пользователей:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });

router.delete("/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const adminEmail = req.user?.email //получаем email админа из рег юзер 
  
  try {
    const result = await client.query("DELETE FROM users WHERE id = $1", [id]);

    if (result.rowCount === 0) {
        return res.status(404).json({error: "Пользователь не найден"});
    }
    console.log(`[${new Date().toISOString()}] ADMIN ACTION SUCCESS: User ${adminEmail || 'unknown'} deleted user ${id}`);
    res.json({ message: "Пользователь удалён "});
  } catch (error) {
    console.error("Ошибка при удалении пользователя: ", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.patch("/admin/users/:id/block", async (req, res) => {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const adminEmail = req.user?.email //получаем email админа из рег юзер 
    try {
        const result = await client.query("UPDATE users SET is_blocked = $1 WHERE id = $2 RETURNING id, is_blocked", [isBlocked, id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({error: "Пользователь не найден"});
        }
        const action = isBlocked ? 'blocked' : 'unblocked';
        console.log(`[${new Date().toISOString()}] ADMIN ACTION SUCCESS: User ${adminEmail || 'unknown'} ${action} user ${id}`);
        res.json({message: `Пользователь ${isBlocked ? "заблокирован" : "разблокирован"}`, user: result.rows[0] });
    } catch (error) {
        console.error( "Ошибка при блокировки пользователя: ", error);
        res.status(500).json({error: "Ошибка сервера"});
    }
});

// === Получить все объявления ===
router.get("/admin/listings", async (req, res) => {
  try {
    const result = await client.query(
      `SELECT l.*, u.email AS user_email
       FROM listings l
       JOIN users u ON u.id = l.user_id
       ORDER BY l.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения объявлений:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// === Удалить объявление ===
router.delete("/admin/listings/:id", async (req, res) => {
  try {
    await client.query("DELETE FROM listings WHERE id = $1", [req.params.id]);
    res.json({ message: "Объявление удалено" });
  } catch (err) {
    console.error("Ошибка удаления:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// === Заблокировать/разблокировать объявление ===
router.patch("/admin/listings/:id/block", async (req, res) => {
  const { isBlocked } = req.body;
  try {
    await client.query(
      "UPDATE listings SET is_blocked = $1 WHERE id = $2",
      [isBlocked, req.params.id]
    );
    res.json({ message: isBlocked ? "Объявление заблокировано" : "Объявление разблокировано" });
  } catch (err) {
    console.error("Ошибка блокировки:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// === Редактировать объявление ===
router.put("/admin/listings/edit/:id", async (req, res) => {
  const { title, description } = req.body;
  try {
    await client.query(
      "UPDATE listings SET title = $1, description = $2 WHERE id = $3",
      [title, description, req.params.id]
    );
    res.json({ message: "Объявление обновлено" });
  } catch (err) {
    console.error("Ошибка редактирования:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;