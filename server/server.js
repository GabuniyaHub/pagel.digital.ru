const http = require("http");
const fs = require("fs"); 
const path = require("path"); 
const formidable = require("formidable");
const express = require("express"); 
const bcrypt = require("bcrypt"); 
const { parse } = require("url");
const dotenv = require("dotenv"); 
const jwt = require("jsonwebtoken"); 
const { Client } = require("pg"); 
const nodemailer = require("nodemailer"); 
const cors = require("cors");
const cookieParser = require('cookie-parser');


// Загрузка переменных окружения
dotenv.config();
const { requireJwtSecret } = require('./config/auth');
requireJwtSecret();

// Константы
const PORT = process.env.PORT;
const SECRET_KEY = process.env.JWT_SECRET ;

// Импорты локальных модулей
const { client } = require("./config/db");
const createTables = require("./models/initDB");
const { userRouters } = require("./routes/userRoutes");
const adminRoutes = require("./routes/AdminPanel/adminRoutes");
const marketRoutes = require("./routes/MarketRoutes/marketRoutes.js");
const accountRoutes = require("./routes/account/accountRoutes.js");
const settingsRoutes = require("./routes/settingsRoutes/settingsRoutes.js");
const chatRoutes = require("./routes/chatRoutes/chatRoutes.js");
const lendingRoutes = require("./routes/lending/lendingRoutes.js");

// Инициализация данных
const failedAttempts = new Map(); // Хранит количество неудачных попыток для каждого email
const blockedUsers = new Map(); // Хранит время разблокировки для каждого email
const verificationCodes = new Map(); // Временное хранилище кодов

// Создание таблиц при старте сервера
createTables();

// Инициализация Express-приложения
const app = express();
app.use(cookieParser());
app.use(express.json({ limit: '5mb', type: 'application/json' }));
app.use(express.static(path.join(__dirname, "../client")));
app.use('/pages', express.static(path.join(__dirname, 'client', 'pages')));
app.use('/assets', express.static(path.join(__dirname, 'client', 'assets')));

//multer
// Раздача загруженных файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Настройка CORS
app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);

// Глобальное логирование запросов
app.use((req, res, next) => {
  console.log(`Запрос: ${req.method} ${req.url}`);
  console.log('Заголовки:', req.headers);
  next();
});

// Подключение маршрутов
app.use("/admin", adminRoutes); // Маршруты для админ-панели
app.use("/market", marketRoutes); // Маршруты для медиа-сетей
app.use("/account", accountRoutes); // Маршруты для аккаунта
app.use("/settings", settingsRoutes); // Маршруты для настроек
app.use("/chat", chatRoutes); // Маршруты для чата
app.use("/lending", lendingRoutes); //Лендинг



// Настройка EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Путь к папке views
app.set("routes", path.join(__dirname, "routes"))
app.use("/market/static", express.static(path.join(__dirname, "views", "market", "assets",)));
app.use("/market/scripts", express.static(path.join(__dirname, "views/market/scripts")));
app.use('/market/assets', express.static(path.join(__dirname, 'views/market/assets')));
app.use('/market/errors', express.static(path.join(__dirname, 'views/market/errors')));
app.use('/market/uploads', express.static(path.join(__dirname, 'routes/uploads')));

// Создание HTTP-сервера
const server = http.createServer((req, res) => {
  // Обработка старых маршрутов
  if (
    req.url.startsWith("/api/createListing") ||
    req.url.startsWith("/api/reg") ||
    req.url.startsWith("/api/send-code") ||
    req.url.startsWith("/api/verify-code") ||
    req.url.startsWith("/api/check-email") ||
    req.url.startsWith("/api/log") ||
    req.url.startsWith("/api/forgot-password") ||
    req.url.startsWith("/api/reset-password") ||
    req.url.startsWith("/api/verify-reset-code") ||
    req.url.startsWith("/api/verify-code-login") ||
    req.url.startsWith("/api/profile") ||
    req.url === "/" ||
    req.url.startsWith("/auth/google") ||
    req.url.startsWith("/auth/vk")
  ) {
    userRouters(req, res);
  } else {
    // Передача запросов в Express
    app(req, res);
  }
});

// Запуск сервера
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
