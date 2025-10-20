# 🌐 PL-GL — Marketplace for Google & YouTube Assets

![PL-GL Logo](https://img.icons8.com/color/96/000000/planet.png)

> 💡 **PL-GL** — это маркетплейс, где пользователи могут безопасно покупать и продавать YouTube-каналы, рекламные аккаунты, а также услуги продвижения в экосистеме Google.

---

## 🎨 Общий стиль

- **Шрифты:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Sofia+Sans+Extra+Condensed:ital,wght@0,1..1000;1,1..1000&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');

  .tinos-bold-italic {
      font-family: "Tinos", serif;
      font-weight: 700;
      font-style: italic;
  }


 ## Структура проекта

PL-GL/
│
├── client/                         # Клиентская часть (Frontend)
│   ├── assets/                     # Статические файлы
│   │   ├── images/                 # Изображения
│   │   ├── icons/                  # SVG-иконки
│   │   ├── fonts/                  # Шрифты
│   │   ├── styles/                 # CSS-стили
│   │   │   ├── global.css          # Общие стили
│   │   │   ├── header/
│   │   │   │   ├── banner.css
│   │   │   │   └── navbar.css
│   │   │   ├── auth/
│   │   │   │   ├── login.css
│   │   │   │   └── register.css
│   │   ├── scripts/                # JS-скрипты
│   │   │   ├── main.js             # Главный файл
│   │   │   ├── components/
│   │   │   │   ├── googleAuth.js   # Авторизация через Google
│   │   │   │   └── navbar.js       # Управление меню
│   │   │   ├── auth/
│   │   │   │   ├── login.js
│   │   │   │   ├── register.js
│   │   │   │   └── forgotPassword.js
│   ├── pages/                      # HTML-страницы
│   │   ├── index.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   ├── react-app/                  # (опционально) React-приложение
│
├── server/                         # Серверная часть (Backend)
│   ├── config/                     # Конфигурация
│   │   ├── db.js                   # Подключение к PostgreSQL
│   │   ├── googleAuth.js           # OAuth2 авторизация Google
│   │   ├── mailer.js               # Настройка Nodemailer
│   ├── controllers/                # Контроллеры
│   │   ├── authController.js       # Логика входа/регистрации
│   │   ├── listingController.js    # Управление объявлениями
│   │   └── userController.js       # Работа с пользователем
│   ├── middleware/
│   │   └── authMiddleware.js       # JWT-проверка
│   ├── routes/                     # API-маршруты
│   │   ├── authRoutes.js
│   │   ├── listingRoutes.js
│   │   └── userRoutes.js
│   ├── models/
│   │   ├── User.js
│   │   └── Listing.js
│   ├── utils/
│   │   └── verificationCodes.js    # Временное хранилище кодов
│   ├── views/                      # EJS-шаблоны
│   │   ├── layout.ejs
│   │   ├── partials/
│   │   │   ├── header.ejs
│   │   │   └── footer.ejs
│   │   ├── market/
│   │   │   ├── youtube.ejs
│   │   │   ├── vk.ejs
│   │   │   └── tg.ejs
│   └── server.js                   # Главный серверный файл
│
├── database/                       # Работа с базой данных
│   ├── migrations/                 # Миграции SQL
│   ├── seeders/                    # Тестовые данные
│   └── schema.sql                  # Структура БД
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md

## Технологический стек

| Компонент           | Технология / Инструмент          |
| ------------------- | -------------------------------- |
| **Frontend**        | HTML5, CSS3, JS (Vanilla), React |
| **Backend**         | Node.js, Express.js              |
| **База данных**     | PostgreSQL                       |
| **Авторизация**     | JWT + Google OAuth2              |
| **Почтовый сервис** | Nodemailer                       |
| **Шаблонизация**    | EJS                              |
| **Контейнеризация** | Docker + Docker Compose          |
| **Сертификаты SSL** | Certbot (Let's Encrypt)          |

## Функционал

🔑 Авторизация и регистрация (в том числе через Google)

👤 Личный кабинет пользователя

🛍️ Публикация и покупка объявлений (YouTube-аккаунты, реклама и т.д.)

💬 Чат с другими пользователями и гарантом

🧾 Панель администратора

🔒 Безопасная работа с токенами (JWT)

📬 Подтверждение email через код

## Запуск проекта (локально)

