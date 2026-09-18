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

## Функционал

🔑 Авторизация и регистрация (в том числе через Google)

👤 Личный кабинет пользователя!

🛍️ Публикация и покупка объявлений (YouTube-аккаунты, реклама и т.д.)

💬 Чат с другими пользователями и гарантом

🧾 Панель администратора

🔒 Безопасная работа с токенами (JWT)

📬 Подтверждение email через код

## Запуск проекта (локально)

git clone -b guram git@github.com:Amantay747/Pagel-Digital.git

# README.md

## О проекте

`pagel.digital.ru` — Node.js-приложение (Express) с фронтендом и лендингом. На сервере работает связка:

- **Nginx** (системный) — принимает трафик на 80/443, обслуживает несколько сайтов, раздаёт статику, проксирует динамику на Node.js.
- **Node.js** (`server/server.js`) — API, лендинг, админка, маркет, чат. Слушает `127.0.0.1:3000`.
- **PostgreSQL** — база `PagelDigital`, пользователь `plgl_user`.

Схема:

```
Интернет → Nginx (80/443)
   ├── другие сайты ( если есть )
   └── yt-pro-market.ru
        ├── /            → статика /var/www/pagel.digital.ru/client
        ├── /lending/    ┐
        ├── /market/     │
        ├── /account/    │
        ├── /settings/   ├─ proxy → 127.0.0.1:3000 (Node.js)
        ├── /chat/       │
        ├── /admin/      │
        └── /uploads/    ┘
                       ↓
              systemd: pagel.service
                       ↓
              PostgreSQL: PagelDigital
```

---

## Требования

- Ubuntu/Debian
- Node.js 22+
- PostgreSQL 15+
- Nginx
- RAM ≥ 1 ГБ (при 1 ГБ обязателен swap 2 ГБ)

---

## Установка с нуля

### 1. Swap (обязательно при малом RAM)

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

### 2. PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Создать пользователя и базу:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER plgl_user WITH PASSWORD 'n2j7hhYjY';
CREATE DATABASE "PagelDigital" OWNER plgl_user;
GRANT ALL PRIVILEGES ON DATABASE "PagelDigital" TO plgl_user;
SQL
```

Проверка:

```bash
PGPASSWORD=n2j7hhYjY psql -h 127.0.0.1 -U plgl_user -d PagelDigital -c '\conninfo'
```

### 3. Оптимизация PostgreSQL под 1 ГБ RAM

Файл: `/etc/postgresql/<версия>/main/postgresql.conf`

```ini
shared_buffers = 128MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 32MB
max_connections = 20
wal_buffers = 4MB
```

```bash
sudo systemctl restart postgresql
```

### 4. Node.js и зависимости

```bash
cd /var/www/pagel.digital.ru
npm install
```

Проверить версию и путь:

```bash
which node        # /usr/bin/node
node --version
```

### 5. `.env`

Файл `/var/www/pagel.digital.ru/.env`:

```env
# Database
DB_USER=plgl_user
DB_PASSWORD=n2j7hhYjY
DB_NAME=PagelDigital
DB_HOST=127.0.0.1
DB_PORT=5432

# JWT
JWT_SECRET=guram

# Порт
PORT=3000
```

**Требования:**
- `DB_HOST=127.0.0.1` (не `db`), потому что приложение работает на хосте, а не в docker-сети.
- Файл должен заканчиваться переводом строки. Иначе Node.js прочитает `PORT` с мусором в конце и упадёт с `EACCES`.
- Проверка: `cat -A .env | tail -3` — последняя строка должна заканчиваться `$`.

### 6. systemd-сервис

Файл `/etc/systemd/system/pagel.service`:

```ini
[Unit]
Description=Pagel App Server
After=network-online.target postgresql.service
Wants=network-online.target
Requires=postgresql.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/var/www/pagel.digital.ru/server
ExecStart=/usr/bin/node server.js
EnvironmentFile=/var/www/pagel.digital.ru/.env
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now pagel.service
sudo systemctl status pagel.service
sudo journalctl -u pagel.service -n 30 --no-pager
```

Ожидаемый вывод:
```
Сервер запущен на http://localhost:3000
Connected to PostgreSQL
Таблицы ... успешно созданы или уже существуют.
```

Проверка порта:

```bash
sudo ss -tlnp | grep 3000
```

### 7. Nginx

Файл `/etc/nginx/sites-enabled/yt-pro-market.ru.conf`:

```nginx
# HTTP → HTTPS редирект
server {
    listen 80;
    listen [::]:80;
    server_name yt-pro-market.ru www.yt-pro-market.ru;
    return 301 https://$host$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name yt-pro-market.ru www.yt-pro-market.ru;

    ssl_certificate /etc/letsencrypt/live/yt-pro-market.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yt-pro-market.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/pagel.digital.ru/client;
    index pages/present.html;

    # Кастомная страница 404
    error_page 404 /pages/404.html;
    location = /pages/404.html {
        internal;
    }

    # === Разделы, которые отдаёт Node.js ===

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /lending/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /market/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /account/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /settings/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /chat/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    # === Всё остальное — статика из client ===
    location / {
        try_files $uri $uri/ =404;
    }
}

```

Проверка и применение:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Проверка работы

```bash
# Статика
curl -s -o /dev/null -w "%{http_code}\n" https://yt-pro-market.ru/

# Динамика (Node.js)
curl -sL -o /dev/null -w "%{http_code}\n" https://yt-pro-market.ru/lending/escrow
curl -sL -o /dev/null -w "%{http_code}\n" https://yt-pro-market.ru/lending/about

# 404
curl -s -o /dev/null -w "%{http_code}\n" https://yt-pro-market.ru/nonexistent

# Другие сайты не сломаны
curl -s -o /dev/null -w "%{http_code}\n" https://avtokond-ugra.ru/
curl -s -o /dev/null -w "%{http_code}\n" https://territoriya-dobroty.ru/
```

Ожидаемо: `200`, `200`, `200`, `404`, `200`, `200`.

---

## Управление

```bash
# Node.js
sudo systemctl status pagel.service
sudo systemctl restart pagel.service
sudo journalctl -u pagel.service -f

# PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl restart nginx

# Проверка автозапуска
sudo systemctl is-enabled pagel postgresql nginx
```

---

## Бэкап

```bash
# База
sudo -u postgres pg_dump PagelDigital > /root/pagel_backup_$(date +%F).sql

# .env
sudo cp /var/www/pagel.digital.ru/.env /root/.env.backup
```

---

## Важные нюансы

1. **`.env` — последняя строка с переводом строки.** Иначе `PORT` парсится с мусором → `EACCES: 3000≈` → сервис падает в цикле рестартов.

2. **`DB_HOST=127.0.0.1`, а не `db`.** `db` резолвится только внутри docker-сети. Приложение работает на хосте.

3. **Пути в `lendingRoutes.js`.** Файл лежит в `server/routes/lending/`, HTML — в `client/pages/lending/`. Правильный путь: `path.join(__dirname, '../../../client/pages/lending')`. Считать вручную `../` легко ошибиться — использовать константу.

4. **`/lending` → 301 → `/lending/`.** Нормальное поведение nginx (`location /lending/` добавляет слеш). Не менять.

5. **Docker не используется.** Контейнеры `db` и `client` из `docker-compose.yml` не запускать: `client` конфликтует с системным nginx за 80/443, `db` избыточен при нативном PostgreSQL.

6. **Другие сайты.** В `sites-enabled/` лежат конфиги `avtokond-ugra.ru.conf` и `territoriya-dobroty.ru.conf`. Их не трогать. При `reload nginx` они не перезапускаются, но конфиг должен оставаться валидным.

7. **Swap.** При 1 ГБ RAM без swap любой пик убивает процессы OOM-killer'ом.

8. **Память.** Следить через `free -h`. При подходе к лимиту — оптимизировать PostgreSQL или добавлять RAM.

---

## Что НЕ делать

- ❌ `docker compose up -d` целиком — займёт 80/443, уронит другие сайты.
- ❌ `docker compose up -d db` — избыточно, база нативная.
- ❌ Менять `DB_HOST` на `db` — не резолвится вне docker-сети.
- ❌ Редактировать `.env` без проверки `cat -A | tail -3`.
- ❌ `systemctl restart nginx` вместо `reload` — рвёт соединения других сайтов.
- ❌ Запускать `pagel.service` до готовности PostgreSQL (в unit-файле есть `Requires=postgresql.service` — не удалять).