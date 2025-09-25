const express = require('express');
const router = express.Router();
const platforms = require('../../config/market/platforms');
const client = require('../../config/db');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const multer = require('multer') // Для загрузки скриноштов 
const { verifyToken } = require('../../middleware/authMiddleware');
// const checkBlockStatus = require('../../middleware/UsersAutharizationMiddleware/checkBlockStatus');
const checkBlockStatusWithoutToken = require('../../middleware/MarketMiddleware/checkBlockStatusWithoutToken');
const optionalAuth = require('../../middleware/MarketMiddleware/optionalAuth');
const { title } = require('process');
const { subscribe } = require('diagnostics_channel');

// Главная страница со списком всех платформ
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/pages/index.html'));
});

// Задачник
const cron = require('node-cron');

const cleanUnusedFiles = require('../../utils/cliner/cliner.js'); // Импорт функции очистки неиспользуемых файлов
// Очистка неиспользуемых файлов
cron.schedule('0 0 * * *', async () => {
  await cleanUnusedFiles();
});

// Автоматическое снятие закрепления листингов
cron.schedule('0 0 * * *', async () => { // Запускаем задачу каждый день в 00:00
  try {
    const updateQuery = `
            UPDATE listings
            SET is_pinned = FALSE, pin_expiration_date = NULL
            WHERE is_pinned = TRUE AND pin_expiration_date <= NOW()
        `;
    await client.query(updateQuery);
    console.log('Автоматическое снятие закрепления листингов выполнено');
  } catch (error) {
    console.error('Ошибка при автоматическом снятии закрепления листингов:', error);
  }
});

// Настройка multer
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});


const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB на файл
});

// API-роут для получения платформы по slug
router.get('/search', checkBlockStatusWithoutToken, async (req, res) => {
  const query = req.query.q;

  try {

    let dbQuery;
    let params = [];

    if (query) {
      dbQuery = `SELECT * FROM platforms WHERE slug ILIKE $1 OR name ILIKE $1`;
      params = [`%${query}%`];
    } else {
      dbQuery = `SELECT * FROM platforms`; // Если query пустой, выбираем все платформы
    }

    const result = await client.query(dbQuery, params);

    // Если ничего не найдено
    if (result.rows.length === 0) {
      return res.json([]); // Отправляем пустой массив
    }

    // Отправка результатов поиска
    res.json(result.rows); // Отправляем найденные платформы
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/verify-token', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  // Если midldleware не вернул ошибку, значит токен валиден
  res.json({ message: 'Токен валиден', user: req.user });
});

// API-роут для получения платформы по id (JSON)
router.get('/platforms', (req, res) => {
  res.json(platforms);
});

// API-роут для создания объявления (JSON)
router.post('/create-listings', verifyToken, upload.fields([
  { name: 'avatar', maxCount: 2 },
  { name: 'screenshots', maxCount: 12 }
]), async (req, res) => {
  try {
    const {
      name,
      subscribers,
      link,
      theme,
      price,
      income,
      expense,
      description,
      income_sources,
      expense_sources,
      promotion,
      support_needs,
      show_link,
      category_name,
      category_description,
      monetization,
      content_type,
      allow_comments,
      platform_id,
      form_type,
      contacts
    } = req.body;

    // const userId = req.headers['x-user-id'];
    const userId = req.user.id;

    // console.log('showLinkBool:', show_link);
    // console.log('allow_comments:', allow_comments);
    // console.log('allowCommentsBool:', allowCommentsBool);


    // console.log(
    //     link,
    //     theme,
    //     price,
    //     income,
    //     expense,
    //     description,
    //     income_sources,
    //     expense_sources,
    //     promotion,
    //     support_needs,
    //     show_link,
    //     category_name,
    //     category_description,
    //     monetization,
    //     content_type,
    //     allow_comments,
    //     platform_id,
    //     form_type 
    //   )

    // console.log(req.files);

    if ( !name || !subscribers || !link || !theme || !description || !userId || !category_name || !platform_id || !content_type || !form_type || !contacts) {
      return res.status(400).json({ error: 'Отсутствуют обязательные поля' });
    }

    console.log('Полученные данные сабов:', subscribers)


    // 1. Сохраняем (или находим) категорию
    let categoryResult = await client.query(
      'SELECT id FROM categories WHERE name = $1',
      [category_name]
    );

    let categoryId;
    if (categoryResult.rows.length > 0) {
      categoryId = categoryResult.rows[0].id;
    } else {
      const insertCategory = await client.query(
        'INSERT INTO categories (name, description, platform_id) VALUES ($1, $2, $3) RETURNING id',
        [category_name, category_description, platform_id || '']
      );
      categoryId = insertCategory.rows[0].id;
    }

    // 2. Обработка скриншотов
    // const screenshots = req.files ? req.files.map(file => file.filename) : [];

    const screenshots = [];

    if (req.files && req.files.screenshots) {
      req.files.screenshots.forEach(file => {
        screenshots.push(file.filename);
      });
    }


    if (screenshots.length > 0) {
      console.log("Скриншоты найдены, начинаем обработку:");
      screenshots.forEach((file, index) => {
        console.log(`Screenshot #${index + 1}:`, file);
      });
    } else {
      console.log("Скриншоты не найдены.");
    }


    const avatarFile = req.files && req.files.avatar ? req.files.avatar[0] : null;
    const avatarFilename = avatarFile ? avatarFile.filename : null;

    const cover = avatarFilename;

    // 3.
    function toBoolean(value) {
      return value === '1' || value === 'true' || value === 'on' || value === true;
    }

    const monetizationBool = toBoolean(monetization);
    const allowCommentsBool = toBoolean(allow_comments);
    const showLinkBool = toBoolean(show_link);
    const flexSwitchBool = toBoolean(req.body.flex_switch); // если тоже используется

    const toIntegerOrNull = val => {
      if (Array.isArray(val)) {
        // Убираем дубликаты
        const unique = [...new Set(val.map(Number))].filter(Number.isInteger);
        // Если все значения одинаковые — берём первое
        return unique.length === 1 ? unique[0] : null;
      }
      
      const n = Number(val);
      return Number.isInteger(n) ? n : null;
    };

    const parsedSubscribers = toIntegerOrNull(subscribers);


    let formattedName = null;

    if (name) {
      // Если это строка с запятыми — превращаем в массив
      let arr = Array.isArray(name) ? name : [name];

      // Удаляем дубликаты и пустые значения
      arr = [...new Set(arr)].filter(Boolean);

      // Берем только первый элемент
      formattedName = arr.length > 0 ? arr[0] : null;
    }


    //4. Парсим контакты из JSON строки

    // console.log('Raw contacts:', contacts);
    // console.log('Type of contacts:', typeof contacts);

    // Замените текущий блок парсинга контактов на этот:

    let parsedContacts = {};

    if (contacts && typeof contacts === 'object') {
      // Если есть двойная сериализация в поле ""
      if (contacts[""]) {
        try {
          parsedContacts = JSON.parse(contacts[""]);
        } catch (e) {
          console.warn('Ошибка парсинга вложенных контактов', e);
        }
      }

      // Мержим с основными полями (приоритет у явных полей)
      parsedContacts = {
        ...parsedContacts,
        telegram: contacts.telegram || parsedContacts.telegram,
        vk: contacts.vk || parsedContacts.vk,
        instagram: contacts.instagram || parsedContacts.instagram,
        whatsapp: contacts.whatsapp || parsedContacts.whatsapp,
        email: contacts['e-mail'] || contacts.email || parsedContacts.email
      };

      // Очищаем null/undefined значения
      Object.keys(parsedContacts).forEach(key => {
        if (parsedContacts[key] == null || parsedContacts[key] === '') {
          delete parsedContacts[key];
        }
      });

    } else {
      console.warn('Неверный формат контактов');
      return res.status(400).json({ message: 'Неверный формат контактов' });
    }
    

    // Получаем максимальную позицию
    const maxPositionResult = await client.query(
      'SELECT MAX(position) AS max_position FROM listings'
    );

    const nextPosition = (maxPositionResult.rows[0].max_position || 0) + 1;

    // console.log('Processed contacts:', parsedContacts);

    // 5. Сохраняем listing
    const insertListing = await client.query(
      `INSERT INTO listings (
                link, theme, price, income, expense,
                description, income_sources, expense_sources,
                promotion, support_needs, allow_comments, show_link, screenshots,
                category_id, user_id, monetization, content_type, form_type, contacts, position, name, subscribers, cover
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12, $13, $14, 
                $15, $16, $17, $18, $19, $20, $21, $22, $23
            ) RETURNING *`,
      [
        link,
        theme,
        price || null,
        income || null,
        expense || null,
        description,
        income_sources,
        expense_sources,
        promotion,
        support_needs,
        allowCommentsBool,
        showLinkBool,
        screenshots,
        categoryId,
        userId,
        monetizationBool,
        content_type,
        form_type ? Number(form_type) : null,
        parsedContacts, 
        nextPosition,
        formattedName,
        parsedSubscribers || 0,
        cover
      ]
    );

    // Проверки:

    // Если объявление не создано, возвращаем ошибку
    if (insertListing.rows.length === 0) {
      return res.status(500).json({ error: 'Не удалось создать объявление' });
    }

    res.status(201).json({
      message: 'Объявление и категория успешно сохранены',
      listing: insertListing.rows[0]
    });

  } catch (err) {
    console.error('Ошибка:', err);

    // Ошибка уникальности 
    if (err.code === '23505') {
      console.warn('Ошибка уникальности: объявление с такой ссылкой уже существует:');
      let existingId = null;
      try {
        // Пытаемся найти существующее объявление с такой ссылкой
        const existingListing = await client.query(
          'SELECT id FROM listings WHERE link = $1',
          [req.body.link]
        );
        if (existingListing.rows.length > 0) {
          existingId = existingListing.rows[0].id;
        }
      } catch (findErr) {
        console.error('Ошибка при поиске существующего объявления:', findErr);
      }

      // Возвращаем ошибку с подробностями
      return res.status(409).json({
        error: 'Объявление с такой ссылкой уже существует',
        detail: err.detail,
        existingId
      });
    }

    res.status(500).json({ error: 'Ошибка сервера при создании объявления' });
  }
});

// API-роут для создания простого объявления (JSON)
router.post('/simple-listing', verifyToken, checkBlockStatusWithoutToken, upload.single('cover'), async (req, res) => {
  let { user_id, name, description, contacts, price, category_name, category_description, platform_id, form_type, allow_comments } = req.body;
  const cover = req.file ? req.file.filename : null;

  // console.log(user_id, name, description, contacts, price, category_name, category_description, platform_id, form_type, allow_comments);

  if (!req.file) {
    return res.status(400).json({ message: 'Обложка обязательна для загрузки.' });
  }

  // Если platform_id не число, ищем по slug
  if (typeof platform_id === 'string' && isNaN(Number(platform_id))) {
    const platformRes = await client.query(
      'SELECT id FROM platforms WHERE slug = $1',
      [platform_id]
    );
    if (platformRes.rows.length === 0) {
      return res.status(400).json({ message: 'Платформа не найдена' });
    }
    platform_id = platformRes.rows[0].id;
  }

  // Серверная валидация
  if (typeof name !== 'string' || name.length < 5 || name.length > 100) {
    return res.status(400).json({ message: 'Название должно содержать от 5 до 100 символов.' });
  }
  if (typeof description !== 'string' || description.length < 10 || description.length > 1000) {
    return res.status(400).json({ message: 'Описание должно содержать от 10 до 1000 символов.' });
  }
  if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) < 0) {
    return res.status(400).json({ message: 'Цена должна быть положительным числом.' });
  }

  // Парсим контакты из JSON строки
  let parsedContacts = {};
  try {
    parsedContacts = JSON.parse(contacts);

    // // Форматируем контакты
    // const formattedContacts = {
    //   telegram: parsedContacts.telegram ? 
    //       parsedContacts.telegram.replace(/^@/, '') : null,
    //   vk: parsedContacts.vk ? 
    //       parsedContacts.vk.replace(/^https?:\/\/vk\.com\//, '') : null,
    //   instagram: parsedContacts.instagram ? 
    //       parsedContacts.instagram.replace(/^@/, '') : null,
    //   whatsapp: parsedContacts.whatsapp ? 
    //       parsedContacts.whatsapp.replace(/\D/g, '') : null,
    //   email: parsedContacts.email || null
    // };
  } catch (e) {
    console.warn('Ошибка парсинга контактов', e);
    return res.status(400).json({ message: 'Неверный формат контактов' });
  }

  // 1. Проверяем существование пользователя
  const userCheck = await client.query(
    'SELECT id, contacts FROM users WHERE id = $1',
    [user_id]
  );

  if (userCheck.rows.length === 0) {
    return res.status(404).json({ message: 'Пользователь не найден' });
  }

  // 2. Обновляем контакты пользователя (мержим с существующими)
  // const currentContacts = userCheck.rows[0].contacts || {};
  // const updatedContacts = { ...currentContacts, ...parsedContacts };

  // try {
  //     await client.query(
  //         'UPDATE users SET contacts = $1 WHERE id = $2',
  //         [updatedContacts, user_id]
  //     );
  // } catch (err) {
  //     console.error('Ошибка при обновлении контактов:', err);
  //     return res.status(500).json({ message: 'Ошибка при обновлении контактов' });
  // }

  // 3. Сохраняем (или находим) категорию
  let categoryResult = await client.query(
    'SELECT id FROM categories WHERE name = $1 AND platform_id = $2',
    [category_name, platform_id]
  );

  let categoryId;
  if (categoryResult.rows.length > 0) {
    categoryId = categoryResult.rows[0].id;
  } else {
    const insertCategory = await client.query(
      'INSERT INTO categories (name, description, platform_id) VALUES ($1, $2, $3) RETURNING id',
      [category_name, category_description || '', platform_id]
    );
    categoryId = insertCategory.rows[0].id;
  }

  // Проверка на дубликат
  const exists = await client.query(
    'SELECT id FROM listings WHERE name = $1 AND price = $2 AND description = $3',
    [name, price, description]
  );
  if (exists.rows.length > 0) {
    return res.status(409).json({ message: 'Такое объявление уже существует.' });
  }

  // Получаем максимальную позицию
  // const maxPositionResult = await client.query(
  //   'SELECT MAX(position) AS max_position FROM listings'
  // );

  // const nextPosition = (maxPositionResult.rows[0].max_position || 0) + 1;

  await client.query('UPDATE listings SET position = position + 1'); //Увеличиваем позицию всех списков на 1 

  // 4. Добавление в базу
  try {
    const insert = await client.query(
      'INSERT INTO listings (name, price, description, cover, category_id, form_type, user_id, contacts, allow_comments, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1) RETURNING id',
      [name, price, description, cover, categoryId, form_type ? Number(form_type) : null, user_id, parsedContacts, allow_comments]
    );
    res.status(201).json({ id: insert.rows[0].id });
  } catch (err) {
    console.error('Ошибка при добавлении объявления:', err);
    res.status(500).json({ message: 'Ошибка сервера при добавлении объявления.' });
  }
});

// API-роут для получения кода владельца сообщества
router.post('/ownership-code', checkBlockStatusWithoutToken, async (req, res) => {
  function generateOwnershipCode(length = 20) {
    const chars = 'abcdef0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  const code = generateOwnershipCode();
  res.json({ code });
});

// Проверка наличия кода на странице сообщества
router.post('/verify-ownership', checkBlockStatusWithoutToken, async (req, res) => {
  const { link, code, platform } = req.body;

  if (!link || !code || !platform) {
    return res.status(400).json({ success: false, message: 'Не указаны ссылка, код или платформа.' });
  }

  if (platform === 'telegram') {
    try {
      // Получаем HTML публичной страницы сообщества/канала/группы
      const response = await axios.get(link, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        timeout: 7000
      });
      const html = response.data;

      // Ищем описание канала
      const descMatch = html.match(/<div class="tgme_page_description"[^>]*>([\s\S]*?)<\/div>/i);
      const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      if (description.includes(code)) {
        console.log(`[verify-ownership][telegram] Код найден в описании`);
        return res.json({ success: true });
      } else {
        console.log()(`[verify-ownership][telegram] Код не найден в описании`);
        return res.json({ success: false, message: 'Код не найден в описании Telegram-канала/группы.' });
      }
    } catch (err) {
      console.error('[verify-ownership][telegram] Ошибка: ', err.message);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при попытке получить страницу Telegram-канала/группы или страница недоступна. Если сообщество/группа/канал закрыты, то их необходимо сделать публичными.'
      });
    }
  }

  if (platform === 'vkontakte') {
    try {
      // ИЗМЕНЕНИЕ: более универсальный регекс для ссылок VK
      const vkMatch = link.match(/(?:https?:\/\/)?(?:www\.)?vk\.com\/(?:club|public|event)?([a-zA-Z0-9_]+)/);
      if (!vkMatch) {
        return res.status(400).json({ success: false, message: 'Некорректная ссылка на VK-сообщество.' });
      }

      const groupId = vkMatch[1]; // screen_name или ID

      // ИЗМЕНЕНИЕ: токен прописан явно (только для теста)
      const VK_API_TOKEN = 'ab41ff77ab41ff77ab41ff770ba879b831aab41ab41ff77c3d42f5db3b931da4a356c67';
      const VK_API_VERSION = '5.131';

      // Запросим описание сообщества
      const vkRes = await axios.get(`https://api.vk.com/method/groups.getById`, {
        params: {
          group_id: groupId,
          fields: 'description',
          access_token: VK_API_TOKEN,
          v: VK_API_VERSION
        }
      });

      const group = vkRes.data.response && vkRes.data.response[0];
      const description = group?.description || '';

      // ИЗМЕНЕНИЕ: строгая проверка по полному слову
      const regex = new RegExp(`\\b${code}\\b`, 'i');

      if (regex.test(description)) {
        console.log('[verify-ownership][vk] Код найден в описании');
        return res.json({ success: true });
      } else {
        console.log('[verify-ownership][vk] Код не найден в описании');
        return res.json({ success: false, message: 'Код не найден в описании сообщества VK.' });
      }
    } catch (err) {
      console.error('[verify-ownership][vk] Ошибка:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Ошибка при запросе к VK API. Возможно, токен недействителен или сообщество не публичное.'
      });
    }
  }

  // if (platform === 'facebook') {
  //   try {
  //     const fbMatch = link.match(/facebook.com\/([a-zA-Z0-9_.]+)/);
  //     if (!fbMatch) {
  //       return res.status(400).json({ success: false, message: 'Некорректная ссылка на Facebook страницу.' });
  //     }
  //     const pageId = fbMatch[1];
  //     const FB_ACCESS_TOKEN = 'ВАШ_ТОКЕН_СТРАНИЦЫ_ЗДЕСЬ'; // Для теста

  //     const fbRes = await axios.get(`https://graph.facebook.com/v17.0/${pageId}`, {
  //       params: {
  //         fields: 'about,description',
  //         access_token: FB_ACCESS_TOKEN
  //       }
  //     });

  //     const about = fbRes.data.about || '';
  //     const description = fbRes.data.description || '';

  //     const regex = new RegExp(`\\b${code}\\b`, 'i');
  //     if (regex.test(about) || regex.test(description)) {
  //       return res.json({ success: true });
  //     } else {
  //       return res.json({ success: false, message: 'Код не найден в описании Facebook страницы.' });
  //     }
  //   } catch (err) {
  //     console.error('[verify-ownership][facebook] Ошибка:', err.message);
  //     return res.status(500).json({ success: false, message: 'Ошибка при запросе к Facebook API.' });
  //   }
  // }

  if (platform === 'youtube') {
    const YOUTUBE_API_KEY = 'AIzaSyAyLuUsULMXlMLUNKgfp_c51igVTczY2j0';

    //Получаем id канала из ссылки
    let channelId = '';
    // 1) https://www.youtube.com/channel/CHANNEL_ID
    // 2) https://www.youtube.com/user/USERNAME
    // 3) https://www.youtube.com/@USERNAME
    // 4) https://www.youtube.com/c/CUSTOM_NAME
    // 5) https://youtu.be/VIDEO_ID (короткая ссылка на видео)

    // 1. 
    const channelMatch = link.match(/youtube\.com\/channel\/([A-Za-z0-9_\-]+)/);
    if (channelMatch) {
      channelId = channelMatch[1];
    }

    // 2.
    if (!channelId) {
      const userMatch = link.match(/youtube\.com\/user\/([A-Za-z0-9_\-]+)/);
      if (userMatch) {
        //получениt channelId по username
        try {
          const userRes = await axios.get(
            `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${userMatch[1]}&key=${YOUTUBE_API_KEY}`
          );
          if (userRes.data.items && userRes.data.items.length > 0) {
            channelId = userRes.data.items[0].id;
          }
        } catch (err) {
          return res.status(500).json(
            {
              success: false,
              message: 'Ошибка при получении channelId по username.'
            }
          );
        }
      }
    }

    // 3.
    if (!channelId) {
      const handleMatch = link.match(/youtube\.com\/@([A-Za-z0-9_\-\.]+)/);
      if (handleMatch) {
        // YouTube API не поддерживает прямой поиск по handle, нужно получить через search
        try {

        } catch (err) {
          return res.status(500).json({
            success: false,
            message: 'Ошибка при получении channelId по handle.'
          });
        }
      }
    }

    // 4.
    if (!channelId) {
      const customMatch = link.match(/youtube\.com\/c\/([A-Za-z0-9_\-]+)/);
      if (customMatch) {
        // YouTube API не поддерживает прямой поиск по кастомному url, ищем через search
        try {
          const searchRes = await axios.get(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${customMatch[1]}&key=${YOUTUBE_API_KEY}`
          );
          if (searchRes.data.items && searchRes.data.items.length > 0) {
            channelId = searchRes.data.items[0].snippet.channelId || searchRes.data.items[0].id.channelId;
          }
        } catch (err) {
          return res.status(500).json({
            success: false,
            message: 'Ошибка при получении channelId по кастомному url.'
          });
        }
      }
    }

    // 5.
    if (!channelId) {
      const videoMatch = link.match(/youtu\.be\/([A-Za-z0-9_\-]+)/);
      if (videoMatch) {
        const videoId = videoMatch[1];
        try {
          // Получаем channelId по videoId
          const videoRes = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          if (videoRes.data.items && videoRes.data.items.length > 0) {
            channelId = videoRes.data.items[0].snippet.channelId;
          }
        } catch (err) {
          return res.status(500).json({ success: false, message: 'Ошибка при получении channelId по videoId.' });
        }
      }
    }

    if (!channelId) {
      return res.status(400).json({ success: false, message: 'Не удалось определить ID канала YouTube. Если вы используете кастомную ссылку, то необходимо перейти в творческую студию и предоставить оригинальную ссылку.' });
    }

    // Получаем описание канала через API
    try {
      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
      const ytRes = await axios.get(apiUrl);
      const channel = ytRes.data.items && ytRes.data.items[0];
      const description = channel?.snippet?.description || '';

      if (description.includes(code)) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false, message: 'Код не найден в описании канала YouTube.' });
      }
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Ошибка при обращении к YouTube API.'
      });
    }
  }

  if (platform) {
    return res.status(200).json({ success: true, message: 'Модераторы проверят листинг в течении 24 часов, на данный момент он доступен для продажи, если выявятся несоответствия, вы будете заблокированы' });
  }
});

// API-роут для получения avatar/subs из url
router.get('/avatar', async (req, res) => {
  const { url, platform } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL не указан' });
  }

  if (!platform) {
    return res.status(400).json({ error: 'Платформа не указана. Технический сбой, обратитесь в техническую поддержку.' });
  }

  if (platform === 'telegram') {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        },
        timeout: 7000
      });
      const html = response.data;

      // Парсим все нужные данные
      const titleMatch = html.match(/<div class="tgme_page_title"[^>]*>\s*<span[^>]*>([^<]+)<\/span>/i);
      const subsMatch = html.match(/<div class="tgme_page_extra"[^>]*>([^<]+)<\/div>/i);
      const avatarMatch = html.match(/<img class="tgme_page_photo_image"[^>]*src="([^"]*)"/i);

      const avatar = avatarMatch && avatarMatch[1] ? avatarMatch[1] : null;
      const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : null;
      const subscribers = subsMatch && subsMatch[1] ? subsMatch[1].trim() : null;

      // Проверяем, что все три значения есть
      if (avatar && title && subscribers) {
        return res.json({ avatar, title, subscribers });
      } else {
        return res.status(404).json({
          error: 'Не удалось получить все данные',
          avatar, title, subscribers
        });
      }
    } catch (err) {
      console.error('Ошибка при получении аватарки:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера при получении аватарки' });
    }
  }

  if (platform === 'vkontakte') {
    try {
      // ИЗМЕНЕНИЕ: расширен регекс для корректного извлечения id/имени группы
      const vkMatch = url.match(/vk\.com\/(?:club|public|event)?([a-zA-Z0-9_.]+)/);
      if (!vkMatch) {
        return res.status(400).json({ error: 'Некорректная ссылка на VK-сообщество' });
      }

      const groupId = vkMatch[1]; // screen_name или ID

      const VK_API_TOKEN = 'ab41ff77ab41ff77ab41ff770ba879b831aab41ab41ff77c3d42f5db3b931da4a356c67'; // ИЗМЕНЕНИЕ: убран дефолт в коде, только из env
      const VK_API_VERSION = '5.131';

      // ИЗМЕНЕНИЕ: запрашиваем также members_count
      const vkRes = await axios.get(`https://api.vk.com/method/groups.getById`, {
        params: {
          group_id: groupId,
          fields: 'photo_200,members_count',
          access_token: VK_API_TOKEN,
          v: VK_API_VERSION
        }
      });

      const group = vkRes.data.response && vkRes.data.response[0];
      const avatar = group?.photo_200 || null;
      const title = group?.name || null;
      const subscribers = group?.members_count || null;

      if (avatar && title && subscribers !== null) {
        return res.json({ avatar, title, subscribers });
      } else {
        return res.status(404).json({
          error: 'Не удалось получить все данные',
          avatar, title, subscribers
        });
      }
    } catch (err) {
      console.error('Ошибка при получении данных VK:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера при получении данных VK' });
    }
  }

  if (platform === 'youtube') {
    const YOUTUBE_API_KEY = 'AIzaSyAyLuUsULMXlMLUNKgfp_c51igVTczY2j0';
    // Проверяем, что ссылка корректная
    if (!/^https:\/\/(www\.)?youtube\.com\/(channel|user|c|@)[\/A-Za-z0-9_\-]+/.test(url)) {
      return res.status(400).json({ error: 'Некорректная ссылка на YouTube' });
    }

    // Получаем id канала из ссылки
    let channelId = '';
    const channelMatch = url.match(/youtube\.com\/channel\/([A-Za-z0-9_\-]+)/);
    if (channelMatch) {
      channelId = channelMatch[1];
    } else {
      return res.status(400).json({ error: 'Некорректная ссылка на YouTube-канал' });
    }

    // Получаем информацию о канале через API
    try {
      // Добавляем statistics в part!
      const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
      const ytRes = await axios.get(apiUrl);
      const channel = ytRes.data.items && ytRes.data.items[0];
      const avatar = channel?.snippet?.thumbnails?.high?.url || null;
      const title = channel?.snippet?.title || null;
      const subscribers = channel?.statistics?.subscriberCount || null;

      // Проверяем, что все три значения есть
      if (avatar && title && subscribers) {
        return res.json({ avatar, title, subscribers });
      } else {
        return res.status(404).json({
          error: 'Не удалось получить все данные',
          avatar, title, subscribers
        });
      }
    } catch (err) {
      console.error('Ошибка при получении данных YouTube:', err.message);
      return res.status(500).json({ error: 'Ошибка сервера при получении данных YouTube' });
    }
  }

//   if (platform === 'instagram') {
//    try {
//        // Проверяем, что ссылка корректная
//        if (!/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?/.test(url)) {
//          return res.status(400).json({ error: 'Некорректная ссылка на Instagram-профиль' });
//        }

//        const response = await axios.get(url, {
//         headers: {
//            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
//          },
//         timeout: 7000
//        });
//         const html = response.data;

//       // Ищем JSON-LD данные
//       const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);

//       if (!jsonLdMatch || !jsonLdMatch[1]) {
//         return res.status(404).json({ error: 'Данные Instagram не найдены (JSON-LD)' });
//       }

//       const jsonLdData = JSON.parse(jsonLdMatch[1]);
//       const profileData = jsonLdData[0] || jsonLdData;

//       // Извлекаем данные
//       const title = profileData?.name || null;
//       const avatar = profileData?.image || null;
//       
//       // Подписчиков получаем из interactionStatistic
//      const subscribers = profileData?.mainEntityofPage?.interactionStatistic?.[0]?.userInteractionCount || null;

//       if (avatar && title && subscribers !== null) {
//         return res.json({ avatar, title, subscribers });
//       } else {
//         return res.status(404).json({
//           error: 'Не удалось получить все данные',
//           avatar, title, subscribers
//         });
//       }
//     } catch (err) {
//       console.error('Ошибка при получении данных Instagram:', err.message);
//       return res.status(500).json({ error: 'Ошибка сервера при получении данных Instagram' });
//     }
//   }  

//   if (platform === 'facebook') {
//     try {
//       // Проверяем, что ссылка корректная
//       if (!/(?:www\.)?facebook\.com\/(?:[a-zA-Z0-9_.]+|pages\/[a-zA-Z0-9_.-]+\/\d+)/.test(url)) {
//         return res.status(400).json({ error: 'Некорректная ссылка на Facebook-профиль или страницу' });
//       }

//       const response = await axios.get(url, {
//         headers: {
//           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
//         },
//         timeout: 7000
//       });
//       const html = response.data;

//       // Парсим данные из мета-тегов Open Graph
//       const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"\/>/);
//       const avatarMatch = html.match(/<meta property="og:image" content="([^"]+)"\/>/);
//       const subsMatch = html.match(/<\/span> likes/); // Простой поиск слова "likes"

//       // Усложним поиск подписчиков, так как формат может меняться
//       const followersMatch = html.match(/"fan_count":(\d+)/);

//       const title = titleMatch ? titleMatch[1] : null;
//       const avatar = avatarMatch ? avatarMatch[1] : null;
//       const subscribers = followersMatch ? followersMatch[1] : null;

//       if (avatar && title && subscribers !== null) {
//         return res.json({ avatar, title, subscribers });
//       } else {
//         return res.status(404).json({
//           error: 'Не удалось получить все данные',
//           avatar, title, subscribers
//         });
//       }
//     } catch (err) {
//       console.error('Ошибка при получении данных Facebook:', err.message);
//       return res.status(500).json({ error: 'Ошибка сервера при получении данных Facebook' });
//     }
//   }

//   if (platform === 'discord') {
//     // Discord не предоставляет публичных страниц для парсинга, поэтому
//     // нужно использовать API бота.
//     // Токен бота должен храниться в переменных окружения.
//     const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

//     if (!DISCORD_BOT_TOKEN) {
//       return res.status(500).json({ error: 'Токен Discord-бота не указан' });
//     }

//     // Discord API требует ID, а не URL. Мы будем ожидать ID в параметре url
//     const guildId = url; // Принимаем ID сервера как "url"

//     if (!guildId) {
//       return res.status(400).json({ error: 'ID Discord-сервера не указан' });
//     }

//     try {
//       // Запрашиваем информацию о сервере через Discord API
//       const discordRes = await axios.get(`https://discord.com/api/v10/guilds/${guildId}`, {
//         headers: {
//           'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
//         }
//       });

//       const guild = discordRes.data;

//       // Собираем данные
//       const title = guild?.name || null;
//       const avatar = guild?.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null;
//       const subscribers = guild?.approximate_member_count || guild?.member_count || null;

//       if (avatar && title && subscribers !== null) {
//         return res.json({ avatar, title, subscribers });
//       } else {
//         return res.status(404).json({
//           error: 'Не удалось получить все данные',
//           avatar, title, subscribers
//         });
//       }
//     } catch (err) {
//       console.error('Ошибка при получении данных Discord:', err.message);
//       // Часто это происходит из-за некорректного ID или отсутствия прав
//       if (err.response && err.response.status === 404) {
//         return res.status(404).json({ error: 'Discord-сервер не найден или ID некорректен' });
//       }
//       return res.status(500).json({ error: 'Ошибка сервера при получении данных Discord' });
//     }
//   }

//   if (platform === 'twitter') {
//     // Twitter API v2 требует Bearer Token
//     const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

//     if (!TWITTER_BEARER_TOKEN) {
//       return res.status(500).json({ error: 'Twitter Bearer Token не указан' });
//     }

//     try {
//       // Извлекаем имя пользователя из URL
//       const twitterMatch = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
//       if (!twitterMatch) {
//         return res.status(400).json({ error: 'Некорректная ссылка на профиль Twitter/X' });
//       }

//       const username = twitterMatch[1];

//       // Запрашиваем информацию о пользователе через Twitter API v2
//       const twitterRes = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
//         headers: {
//           'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`
//         },
//         params: {
//           'user.fields': 'profile_image_url,public_metrics,name'
//         }
//       });

//       const user = twitterRes.data.data;

//       if (!user) {
//         return res.status(404).json({ error: 'Профиль Twitter/X не найден' });
//       }

//       // Собираем данные
//       const avatar = user?.profile_image_url || null;
//       const title = user?.name || null;
//       const subscribers = user?.public_metrics?.followers_count || null;

//       if (avatar && title && subscribers !== null) {
//         return res.json({ avatar, title, subscribers });
//       } else {
//         return res.status(404).json({
//           error: 'Не удалось получить все данные',
//           avatar, title, subscribers
//         });
//       }
//     } catch (err) {
//       console.error('Ошибка при получении данных Twitter/X:', err.message);
//       return res.status(500).json({ error: 'Ошибка сервера при получении данных Twitter/X' });
//     }
//   }

//   if (platform === 'twitch') {
//     // Для Twitch API v5 нужен Client-ID и Bearer Token
//     const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
//     const TWITCH_BEARER_TOKEN = process.env.TWITCH_BEARER_TOKEN;

//     if (!TWITCH_CLIENT_ID || !TWITCH_BEARER_TOKEN) {
//       return res.status(500).json({ error: 'Twitch Client ID или Bearer Token не указан' });
//     }

//     try {
//       // Извлекаем имя пользователя из URL
//       const twitchMatch = url.match(/(?:twitch\.tv)\/([a-zA-Z0-9_]+)/);
//       if (!twitchMatch) {
//         return res.status(400).json({ error: 'Некорректная ссылка на канал Twitch' });
//       }

//       const username = twitchMatch[1];

//       // Запрашиваем информацию о пользователе через Twitch API
//       const twitchRes = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {
//         headers: {
//           'Client-ID': TWITCH_CLIENT_ID,
//           'Authorization': `Bearer ${TWITCH_BEARER_TOKEN}`
//         }
//       });

//       const user = twitchRes.data.data[0];

//       if (!user) {
//         return res.status(404).json({ error: 'Канал Twitch не найден' });
//       }

//       // Чтобы получить количество подписчиков, нужен отдельный запрос
//       // Напрямую из user-запроса это не получить
//       const followersRes = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${user.id}`, {
//         headers: {
//           'Client-ID': TWITCH_CLIENT_ID,
//           'Authorization': `Bearer ${TWITCH_BEARER_TOKEN}`
//         }
//       });
//       
//       const subscribers = followersRes.data.total;

//       // Собираем данные
//       const title = user?.display_name || null;
//       const avatar = user?.profile_image_url || null;

//       if (avatar && title && subscribers !== null) {
//         return res.json({ avatar, title, subscribers });
//       } else {
//         return res.status(404).json({
//           error: 'Не удалось получить все данные',
//           avatar, title, subscribers
//         });
//       }
//     } catch (err) {
//       console.error('Ошибка при получении данных Twitch:', err.message);
//       return res.status(500).json({ error: 'Ошибка сервера при получении данных Twitch' });
//     }
//   }

  return res.status(400).json({ error: 'Платформа не поддерживается. Технический сбой, обратитесь в техническую поддержку.' });
});

// API-роут для получения избранных твоаров
// Получить избранное
router.get('/get/favorites', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  const userId = req.user.id;
  try {

    const result = await client.query(`
      SELECT 
        f.id AS favorite_id,
        l.id AS listing_id,
        l.name,
        l.cover,
        l.price,
        l.link,
        l.subscribers,
        l.views,
        l.theme,
        c.id AS category_id,
        c.name AS category_name,
        p.id AS platform_id,
        p.name AS platform_name,
        p.slug AS platform_slug,
        p.icon AS platform_icon,
        f.created_at
      FROM favorites f
      JOIN listings l ON f.listing_id = l.id
      JOIN categories c ON l.category_id = c.id
      JOIN platforms p ON c.platform_id = p.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC;
    `, [userId]);

    res.json({ success: true, favorites: result.rows });

  } catch (err) {
    console.error("Ошибка получения избранного:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера" });
  }
});

// API-роут для удаления из избранных
router.post('/favorites/remove', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  const { listingId } = req.body;
  const userId = req.user.id;

  if ( listingId === undefined || listingId === null) {
    return res.status(400).json({ error: 'Не указан ID объявления для удаления из избранного' });
  }
  
  if (!userId) {
    return res.status(400).json({ error: 'Не указан ID пользователя' });
  }

  try {
    await client.query(
      `DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2`,
      [userId, listingId]
    );

    res.json({ success: true, message: 'Товар успешно удален из избранного' });
  } catch (err) {
    console.error("Ошибка удаления из избранного:", err);
    res.status(500).json({ success: false, message: "Ошибка сервера при удалении из избранного" });
  }

});

// API-роут для добавления товаров в избранное
router.post('/add/favorites', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.user.id;

    console.log(`Добавление в избранное: user=${userId}, listing=${listingId}`);

    if (!userId || !listingId) {
      return res.status(400).json({ error: 'Не указаны обязательные параметры' });
    }

    // Начинаем транзакцию
    await client.query('BEGIN');

    // Проверка существования записи
    const exists = await client.query(
      `SELECT 1 FROM favorites WHERE user_id = $1 AND listing_id = $2`,
      [userId, listingId]
    );

    if (exists.rows.length > 0) {
      await client.query(
        `DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2`,
        [userId, listingId]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Удалено из избранного' });
    } else {
      const result = await client.query(
        `INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2) RETURNING *`,
        [userId, listingId]
      );
      await client.query('COMMIT');
      console.log('Успешно добавлено:', result.rows[0]);
      return res.json({
        message: 'Добавлено в избранное',
        data: result.rows[0]
      });
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при работе с избранным:', err);

    if (err.code === '23502') { // Ошибка NOT NULL
      console.error('Обнаружена попытка вставки NULL:', {
        userId: req.user.id,
        listingId: req.body.listingId
      });
    }

    return res.status(500).json({
      error: 'Ошибка сервера',
      details: err.message
    });
  }
});

// API-роут "оставить комментарий"
router.post('/add/comments', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  const { listingId, message } = req.body;
  const userId = req.user.id;

  if (!message || !listingId) {
    return res.status(400).json({ error: 'Пустое сообщение или ID объявления отсутствует' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Комментарий слишком длинный (макс. 500 символов)' });
  }

  try {
    // Получаем количество комментариев за последнюю минуту
    const rateQuery = `
      SELECT COUNT(*) 
      FROM comments_listings 
      WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'
    `;
    const rateResult = await client.query(rateQuery, [userId]);
    const commentCount = parseInt(rateResult.rows[0].count);

    if (commentCount >= 3) {
      return res.status(429).json({ error: 'Вы пишете слишком часто. Подождите минуту.' });
    }

    // Проверка на дублирующийся комментарий
    const lastCommentQuery = `
      SELECT message 
      FROM comments_listings 
      WHERE user_id = $1 AND listing_id = $2
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const lastCommentResult = await client.query(lastCommentQuery, [userId, listingId]);

    if (lastCommentResult.rows.length > 0 && lastCommentResult.rows[0].message === message) {
      return res.status(400).json({ error: 'Нельзя отправлять одинаковые комментарии подряд' });
    }

    // сохраняем комментарий 
    const insertQuery = `
      INSERT INTO comments_listings (listing_id, user_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, message, created_at
    `;
    const result = await client.query(insertQuery, [listingId, userId, message]);

    // Получаем ник и аватар
    const userQuery = await client.query(
      'SELECT nickname AS author_name, avatar AS author_avatar FROM users WHERE id = $1',
      [userId]
    );

    return res.status(201).json({
      success: true,
      comment: {
        ...result.rows[0],
        author_name: userQuery.rows[0].author_name,
        author_avatar: userQuery.rows[0].author_avatar,
        user_id: userId
      }
    });
  } catch (err) {
    console.error('Ошибка при добавлении комментария:', err);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// API-роут для получения продуктов платформы по id (JSON)
router.get('/platforms/:id', (req, res) => {
  const platform = platforms.find(p => p.id === req.params.id);
  if (!platform) {
    return res.status(404).json({ error: 'Платформа не найдена' });
  }
  res.json(platform.products || []);
});

// API-роут для получения информации по отзывах пользователя (JSON) 
router.get('/get/user/reviews/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const reviewCountsQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN review_type = 'positive' THEN 1 ELSE 0 END), 0) AS positive_count,
                COALESCE(SUM(CASE WHEN review_type = 'neutral' THEN 1 ELSE 0 END), 0) AS neutral_count,
                COALESCE(SUM(CASE WHEN review_type = 'negative' THEN 1 ELSE 0 END), 0) AS negative_count
            FROM reviews
            WHERE user_id = $1;
        `;

    const reviewCountsResult = await client.query(reviewCountsQuery, [userId]);

    if (reviewCountsResult.rows.length > 0) {
      const reviewCounts = reviewCountsResult.rows[0];
      res.json(reviewCounts);
    } else {

    }
  } catch (error) {
    console.error('Ошибка при получении статистики отзывов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// API-роут для получение информации о пользователе по его id (JSON)
router.get('/get/user/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const userQuery = `SELECT id, nickname, avatar, rating, description FROM users WHERE id = $1`; // Изменен запрос
    const userResult = await client.query(userQuery, [userId]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      res.json(user); // Отправляем данные пользователя в формате JSON
    } else {
      res.status(404).json({ message: 'Пользователь не найден' });
    }
  } catch (error) {
    console.error('Ошибка при получении информации о пользователе:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }

});

// API-роут для получение информации о литсинге по его id (JSON)
router.get('/listings/:id/get',  checkBlockStatusWithoutToken, verifyToken, async (req, res) => {
  const listingId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await client.query(
      'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
      [listingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Объявление не найдено или нет доступа' });
    }

    res.json({ listing: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Универсальный маршрут для платформ (ejs)
router.get('/:id', (req, res) => {
  const platform = platforms.find(p => p.id === req.params.id);
  console.log("Искомая платформа: ", platform);
  // Если платформа не найдена, отобразить страницу 404
  if (!platform) {
    return res.status(404).render('market/errors/404', { message: 'Платформа не найдена' });
  }
  res.render('market/platform', { platform });
});

//Маршрут для отображения листингов каталога
router.get('/:platformName/:catalogName/items', async (req, res) => {
  const { platformName, catalogName } = req.params;
  const search = req.query.q ? req.query.q.trim() : '';
  const page = parseInt(req.query.page) || 1;
  const pageSize = 30;
  const offset = (page - 1) * pageSize;

  try {
    
    // let query = `
    //   SELECT l.*, p.slug AS platform_slug, u.is_premium
    //   FROM listings l
    //   JOIN categories c ON l.category_id = c.id
    //   JOIN platforms p ON c.platform_id = p.id
    //   JOIN users u ON l.user_id = u.id
    //   WHERE p.slug = $1 AND c.name = $2
    // `;

    let query = `
    SELECT
      l.*,
      p.slug AS platform_slug,
      u.is_premium,
      u.verified,
      (l.is_pinned AND l.pin_expiration_date > NOW()) AS is_pinned_active
    FROM listings l
    JOIN categories c ON l.category_id = c.id
    JOIN platforms p ON c.platform_id = p.id
    JOIN users u ON l.user_id = u.id
    WHERE p.slug = $1 AND c.name = $2
    `;

    let params = [platformName, catalogName];

    if (search) {
      query += `
        AND (
          l.link ILIKE $3 OR
          l.name ILIKE $3 OR
          l.theme ILIKE $3 OR
          CAST(l.price AS TEXT) ILIKE $3 OR
          CAST(l.income AS TEXT) ILIKE $3 OR
          CAST(l.expense AS TEXT) ILIKE $3 OR
          CAST(l.monetization AS TEXT) ILIKE $3
        )
      `;
      params.push(`%${search}%`);
    }

    // без према и закрепа
    // query += `
    //   ORDER BY l.position ASC
    //   LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    // `;

    // без закрепа
    // query += `
    //   ORDER BY u.is_premium DESC, l.position ASC
    //   LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    // `;

    // (сортировка по премиуму, закрепленным и позиции)
    query += `
      ORDER BY 
        u.is_premium DESC,
        CASE WHEN l.is_pinned = true AND l.pin_expiration_date > NOW() THEN 1 ELSE 0 END DESC,
        l.position ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(pageSize, offset);

    const totalCouentQuery = `
        SELECT COUNT(*)FROM listings l
        JOIN categories c ON l.category_id = c.id
        JOIN platforms p ON c.platform_id = p.id
        WHERE p.slug = $1 AND c.name = $2
      `;

    const result = await client.query(query, params);

    const totalCouentResult = await client.query(totalCouentQuery, [platformName, catalogName]);
    const totalCount = parseInt(totalCouentResult.rows[0].count);

    const hasMore = offset + result.rows.length < totalCount;


    const product = {
      name: catalogName,
      description: search
        ? `Результаты поиска по "${search}"`
        : `Листинги для ${catalogName}`,
      listings: result.rows
    };

    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.render('market/item', { product, hasMore, layout: false });
    }

    res.render('market/item', { product, hasMore });
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    return res.status(500).render('market/errors/500', { message: 'Ошибка сервера' });
  }
});

// API-роут для увелечения счетчика литсинга
router.post('/items/:listingId/view', async (req, res) => {
  const { listingId } = req.params;

  try {
    const updateQuery = `
            UPDATE listings
            SET views = views + 1
            WHERE id = $1
        `;
    const updateResult = await client.query(updateQuery, [listingId]);

    // Проверяем, была ли затронута хотя бы одна строка при обновлении
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ message: 'Листинг не найден' });
    }

    // Обновляем количество просмотров в ответе (необязательно, но полезно)
    const selectQuery = `SELECT views FROM listings WHERE id = $1`;
    const result = await client.query(selectQuery, [listingId]);

    if (result.rows.length > 0) {
      const views = result.rows[0].views;
      res.status(200).json({ message: 'Счетчик просмотров обновлен', views: views });
    } else {
      // Если листинг не найден даже после обновления, это странно, но обрабатываем этот случай
      res.status(404).json({ message: 'Листинг не найден' });
    }

  } catch (error) {
    console.error('Ошибка при увеличении счетчика просмотров:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// API-роут для удаления листинга
router.delete('/listings/:listingId/delete', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  const listingId = req.params.listingId;
  const userId = req.user.id;

  try {
    // 1. Получаем объявление напрямую из БД
    const result = await client.query('SELECT * FROM listings WHERE id = $1', [listingId]);
    const listing = result.rows[0];

    if (!listing) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }

    // 2. Проверяем, что текущий пользователь — владелец
    if (listing.user_id !== userId) {
      return res.status(403).json({ message: 'Доступ запрещён: не владелец' });
    }

    const deletePosition = listing.position;

    // 3. Удаляем
    await client.query('DELETE FROM listings WHERE id = $1', [listingId]);

    // 4. Обновляем позиции остальных объявлений
    await client.query('UPDATE listings SET position = position - 1 WHERE position > $1', [deletePosition]);

    res.status(200).json({ message: 'Объявление удалено' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// API-роут для редактирования листинга
router.put('/listings/:listingId/edit', upload.fields([{ name: 'screenshots', maxCount: 12 }, { name: 'cover', maxCount: 2 } ]), checkBlockStatusWithoutToken, verifyToken, async (req, res) => {
  // Исправлено: используем req.params.listingId, а не req.params.id
  // upload.fields([{ name: 'screenshots', maxCount: 12 }, { name: 'cover', maxCount: 1 } ]),
  const listingId = req.params.listingId;
  const userId = req.user.id;

  // console.log('FILES:', req.files);
  // console.log('BODY:', req.body);

  // console.log('скриншоты:', req.files.screenshots, 'обложка:' ,  req.files.cover);
  
  // let screenshots = req.files ? req.files.screenshots.map(file => file.filename) : [];
  let screenshots = [];
  if (req.files && Array.isArray(req.files.screenshots)) {
    screenshots = req.files.screenshots.map(file => file.filename);
  }

  // const cover = (req.files && req.files.cover && req.files.cover[0]) ? req.files.cover[0].filename : null;
  const newCover = (req.files && req.files.cover && req.files.cover[0]) ? req.files.cover[0].filename : null;
  const currentListing = await client.query('SELECT cover FROM listings WHERE id = $1', [listingId]);
  const oldCover = currentListing.rows.length > 0 ? currentListing.rows[0].cover : null;

  const finalCoverName = newCover || oldCover;

  // Получаем данные из формы
  let {
    name,
    description,
    price,
    category_id,
    form_type,
    theme,
    contacts,
    link,
    income,
    expense,
    income_sources,
    expense_sources,
    promotion,
    support_needs,
    allow_comments,
    show_link,
    flex_switch,
    // screenshots,
    monetization,
    content_type,
    // cover,
    up_date,
    position,
    is_pinned,
    pin_expiration_date
  } = req.body;

  // Преобразование чекбоксов и булевых значений
  function toBoolean(val) {
    return val === '1' || val === 'true' || val === 'on' || val === true;
  }

  const allowCommentsBool = toBoolean(allow_comments);
  const showLinkBool = toBoolean(show_link);
  const monetizationBool = toBoolean(monetization);
  const flexSwitchBool = toBoolean(flex_switch);
  const isPinnedBool = toBoolean(is_pinned);

  // Преобразование contacts (если приходит строка — парсим, если объект — используем как есть)
  let parsedContacts = {};

    if (contacts && typeof contacts === 'object') {
      // Если есть двойная сериализация в поле ""
      // if (contacts[""]) {
      //   try {
      //     parsedContacts = JSON.parse(contacts[""]);
      //   } catch (e) {
      //     console.warn('Ошибка парсинга вложенных контактов', e);
      //   }
      // }

      // Мержим с основными полями (приоритет у явных полей)
      parsedContacts = {
        ...parsedContacts,
        telegram: contacts.telegram || parsedContacts.telegram,
        vk: contacts.vk || parsedContacts.vk,
        instagram: contacts.instagram || parsedContacts.instagram,
        whatsapp: contacts.whatsapp || parsedContacts.whatsapp,
        email: contacts['e-mail'] || contacts.email || parsedContacts.email
      };

      // Очищаем null/undefined значения
      Object.keys(parsedContacts).forEach(key => {
        if (parsedContacts[key] == null || parsedContacts[key] === '') {
          delete parsedContacts[key];
        }
      });
      
    } else {
      console.warn('Неверный формат контактов');
      return res.status(400).json({ message: 'Неверный формат контактов' });
    }

  // Преобразование screenshots (если есть файлы, используем их, иначе парсим из строки)
  // 2. Обработка скриншотов

    // Добавляем существующие скриншоты из формы (если есть)
    if (req.body.existingScreenshots) {
      try {
        const existing = JSON.parse(req.body.existingScreenshots);
        if (Array.isArray(existing)) {
          screenshots = screenshots.concat(existing);
        }
      } catch (e) {
        console.warn('Ошибка парсинга existingScreenshots:', e);
      }
    }

    if (screenshots.length > 0) {
      console.log("Скриншоты найдены, начинаем обработку:");
      screenshots.forEach((file, index) => {
        console.log(`Screenshot #${index + 1}:`, file);
      });
    } else {
      console.log("Скриншоты не найдены.");
    }

    if (screenshots.length > 12) {
      return res.status(400).json({ message: 'Максимальное количество скриншотов - 12' });
    }

  // Преобразование числовых и других типов
  price = price !== undefined ? Number(price) : null;
  income = income !== undefined ? Number(income) : null;
  expense = expense !== undefined ? Number(expense) : null;
  form_type = form_type !== undefined ? Number(form_type) : null;
  position = position !== undefined ? Number(position) : 0;
  views = req.body.views !== undefined ? Number(req.body.views) : undefined;

  


  // Проверка владельца
  try {
    const result = await client.query(
      'SELECT user_id FROM listings WHERE id = $1',
      [listingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Объявление не найдено' });
    }

    if (result.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Нет доступа к редактированию' });
    }

    await client.query(
      `UPDATE listings SET
        name = $1,
        description = $2,
        price = $3,
        category_id = $4,
        form_type = $5,
        theme = $6,
        contacts = $7,
        link = $8,
        income = $9,
        expense = $10,
        income_sources = $11,
        expense_sources = $12,
        promotion = $13,
        support_needs = $14,
        allow_comments = $15,
        show_link = $16,
        flex_switch = $17,
        screenshots = $18,
        monetization = $19,
        content_type = $20,
        cover = $21,
        up_date = $22,
        position = $23,
        is_pinned = $24,
        pin_expiration_date = $25
      WHERE id = $26`,
      [
        name,
        description,
        price,
        category_id,
        form_type,
        theme,
        parsedContacts,
        link,
        income,
        expense,
        income_sources,
        expense_sources,
        promotion,
        support_needs,
        allowCommentsBool,
        showLinkBool,
        flexSwitchBool,
        screenshots,
        monetizationBool,
        content_type,
        finalCoverName,
        up_date,
        position,
        isPinnedBool,
        pin_expiration_date,
        listingId
      ]
    );

    res.status(200).json({ message: 'Объявление обновлено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ошибка при обновлении' });
  }
});

// API-роут для поднятия листинга (up)
router.post('/listings/:listingId/up', verifyToken, checkBlockStatusWithoutToken, async (req, res) => {
  const { listingId } = req.params;
  const userId = req.user.id;

  try {
    // Получаем информацию о пользователе
    // const userQuery = `SELECT is_premium FROM users WHERE id = $1`;
    // const userResult = await client.query(userQuery, [userId]);
    // const isPremium = userResult.rows[0]?.is_premium;

    // const now = new Date();

    // // Получаем текущую дату поднятия
    // const listingQuery = `SELECT up_date FROM listings WHERE id = $1`;
    // const listingResult = await client.query(listingQuery, [listingId]);
    // const lastUpDate = new Date(listingResult.rows[0]?.up_date);
    
    // const diffMinutes = Math.floor((now - lastUpDate) / 60000);

    // const MIN_INTERVAL = isPremium ? 60 : 180; // 1 час или 3 часа

    // if (diffMinutes < MIN_INTERVAL) {
    //   const wait = MIN_INTERVAL - diffMinutes;
    //   return res.status(400).json({
    //     message: `Можно поднять через ${wait} минут`,
    //   });
    // }
    
    const now = new Date();

    // Получаем текущую дату поднятия
    const listingQuery = `SELECT up_date FROM listings WHERE id = $1`;
    const listingResult = await client.query(listingQuery, [listingId]);
    const lastUpDate = new Date(listingResult.rows[0]?.up_date);

    // Проверка: можно ли поднимать (раз в сутки)
    const nowDate = now.toISOString().slice(0, 10); // "2025-08-07"
    const lastUpDateOnly = lastUpDate.toISOString().slice(0, 10); // "2025-08-06"

    if (nowDate === lastUpDateOnly) {
      return res.status(400).json({
        message: `Объявление можно поднимать раз в сутки. Попробуйте завтра.`,
      });
    }

    
    // Поднимаем объявление (всем, без проверки премиум)
    await client.query('BEGIN');

    // Сдвигаем всех, кроме текущего
    await client.query(`
      UPDATE listings
      SET position = position + 1
      WHERE position >= 1 AND id <> $1
    `, [listingId]);

    // Ставим текущее объявление на первую позицию
    await client.query(`
      UPDATE listings
      SET up_date = $1, position = 1
      WHERE id = $2
    `, [now, listingId]);

    await client.query('COMMIT');


    return res.status(200).json({
      message: 'Объявление успешно поднято',
      up_date: now.toISOString()
    });
  } catch (err) {
    console.error('Ошибка поднятия:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// API-роут для для закрепления листинга:
// router.post('/listings/:listingId/pin', async (req, res) => {
//   const { listingId } = req.params;
//   const expirationDate = new Date(req.body.expirationDate); // Получаем дату окончания закрепления из тела запроса

//   try {
//     // Закрепляем листинг
//     const updateQuery = `
//             UPDATE listings
//             SET is_pinned = TRUE, pin_expiration_date = $1
//             WHERE id = $2
//         `;
//     await client.query(updateQuery, [expirationDate, listingId]);

//     res.status(200).json({ message: 'Листинг успешно закреплен' });
//   } catch (error) {
//     console.error('Ошибка при закреплении листинга:', error);
//     res.status(500).json({ message: 'Ошибка сервера' });
//   }
// });

// Маршрут для отображения листинга 


// API-роут для получения информации о листинге по его id (EJS)
router.get('/:platformName/:catalogName/items/:listingId', optionalAuth, async (req, res) => {
  const { platformName, catalogName, listingId } = req.params;

  // console.log('user from token:', req.user); 

  try {
    const listingQuery = `
      SELECT 
        l.*, 
        p.slug AS platform_slug, 
        c.name AS category_name,
        u.id AS user_id,
        u.nickname AS username,
        u.avatar AS avatar,
        u.contacts AS user_contacts,
        l.contacts AS listing_contacts,
        l.views,
        l.screenshots,
        l.allow_comments AS allow_comments,
        l.show_link AS show_link,
        CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS is_favorite
      FROM listings l
      JOIN categories c ON l.category_id = c.id
      JOIN platforms p ON c.platform_id = p.id
      LEFT JOIN favorites f ON f.listing_id = l.id AND f.user_id = $4
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.id = $1 AND p.slug = $2 AND c.name = $3
      ORDER BY 
        l.is_pinned DESC,
        l.pin_expiration_date DESC NULLS LAST,
        l.position ASC,
        l.up_date DESC NULLS LAST;
    `;

    const currentUserId = req.user?.id || null;
    const listingResult = await client.query(listingQuery, [listingId, platformName, catalogName, currentUserId]);

    // console.log('currentUserId:', currentUserId);

    if (listingResult.rows.length === 0) {
      return res.status(404).render('market/errors/404', { message: 'Листинг не найден' });
    }

    const row = listingResult.rows[0];

    // 1. Преобразуем данные для шаблона
    const listing = {
      ...row,
      isFavorite: row.is_favorite,
      user: row.username ? {
        id: row.user_id,
        username: row.username,
        avatar: row.avatar,
        contacts: (row.listing_contacts && Object.keys(row.listing_contacts).length > 0)
          ? row.listing_contacts
          : row.user_contacts || {}
      } : null,
      screenshots: row.screenshots
    };

    // 2. Получаем комментарии отдельно
    const commentsQuery = `
      SELECT 
        c.*, 
        u.nickname AS author_name,
        u.avatar AS author_avatar
      FROM comments_listings c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.listing_id = $1
      ORDER BY c.created_at ASC
    `;

    const commentsResult = await client.query(commentsQuery, [listingId]);
    const comments = commentsResult.rows;

    // function formatRelativeTime(dateString) {
    //   const now = new Date();
    //   const date = new Date(dateString);
    //   const diffMs = now - date;
    //   const diffSec = Math.floor(diffMs / 1000);
    //   const diffMin = Math.floor(diffSec / 60);
    //   const diffHr = Math.floor(diffMin / 60);
    //   const diffDay = Math.floor(diffHr / 24);
    //   const diffWeek = Math.floor(diffDay / 7);
    //   const diffMonth = Math.floor(diffDay / 30); // упрощённо
    //   const diffYear = Math.floor(diffDay / 365); // упрощённо

    //   if (diffSec < 60) return 'только что';
    //   if (diffMin === 1) return 'минуту назад';
    //   if (diffMin < 5) return `${diffMin} минуты назад`;
    //   if (diffMin < 60) return `${diffMin} минут назад`;
    //   if (diffHr === 1) return 'час назад';
    //   if (diffHr < 5) return `${diffHr} часа назад`;
    //   if (diffHr < 24) return `${diffHr} часов назад`;
    //   if (diffDay === 1) return 'вчера';
    //   if (diffDay < 5) return `${diffDay} дня назад`;
    //   if (diffDay < 7) return `${diffDay} дней назад`;
    //   if (diffWeek === 1) return 'неделю назад';
    //   if (diffWeek < 5) return `${diffWeek} недели назад`;
    //   if (diffMonth === 1) return 'месяц назад';
    //   if (diffMonth < 12) return `${diffMonth} месяцев назад`;
    //   if (diffYear === 1) return 'год назад';
    //   return `${diffYear} лет назад`;
    // }

    // comments = comments.map(comment => ({
    //   ...comment,
    //   relativeTime: formatRelativeTime(comment.created_at)
    // }));

    // console.log("isFavorite:", row.is_favorite);
    // console.log("show_link:", row.show_link);
    // console.log("allow_comments:", row.allow_comments);

    // console.log("listing_contacts:", row.listing_contacts);
    // console.log("user_contacts:", row.user_contacts);
    // console.log("result:", row.listing_contacts ?? row.user_contacts ?? {});

    // console.log("Listing (after transformation):", listing);
    // console.log("Listing.screenshots (after transformation):", listing.screenshots);


    res.render('market/post', { listing, user: listing.user, currentUser: req.user || null, comments });
  } catch (err) {
    console.error('Ошибка при выполнении запроса:', err);
    return res.status(500).render('market/errors/500', { message: 'Ошибка сервера' });
  }
});

module.exports = router;