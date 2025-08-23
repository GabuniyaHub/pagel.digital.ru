// utils/cleaner.js
const fs = require('fs');
const path = require('path');
const client = require('../../config/db');

const LOCAL_FOLDER = path.join(__dirname, '../../routes/uploads'); // папка с файлами

// Рекурсивная функция для получения всех файлов во всех подпапках
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  let filesList = arrayOfFiles || [];

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      filesList = getAllFiles(filePath, filesList);
    } else {
      filesList.push(filePath);
    }
  });

  return filesList;
}

async function cleanUnusedFiles() {
  console.log('🚀 Запуск скрипта очистки файлов...');
  console.log(`📂 Рабочая папка: ${LOCAL_FOLDER}`);

  try {
    const allFiles = getAllFiles(LOCAL_FOLDER);
    console.log(`🔍 Найдено файлов: ${allFiles.length}`);
    
    if (allFiles.length === 0) {
      console.log('✅ В папке нет файлов для проверки. Очистка завершена.');
      return;
    }
    
    for (const filePath of allFiles) {
      const fileName = path.basename(filePath); // Извлекаем только имя файла
      
      // 1. Проверяем, используется ли файл в listings
      const listingsQuery = 'SELECT id FROM listings WHERE cover = $1 OR $1 = ANY(screenshots)';
      const listingsResult = await client.query(listingsQuery, [fileName]);

      if (listingsResult.rows.length > 0) {
        console.log(`\n📌 Файл ${fileName} используется в listings, пропускаем`);
        continue;
      }

      // 2. Если не используется в listings, проверяем users
      const relativePath = path.relative(LOCAL_FOLDER, filePath).replace(/\\/g, '/');
      const dbPath = `/market/uploads/${relativePath}`; // Формируем полный путь для таблицы users
      
      const usersQuery = 'SELECT id FROM users WHERE avatar = $1';
      const usersResult = await client.query(usersQuery, [dbPath]);

      if (usersResult.rows.length > 0) {
        console.log(`\n📌 Файл ${fileName} используется как аватар, пропускаем`);
        continue;
      }

      console.log(`\n🗑 Файл ${fileName} не используется. Попытка удаления...`);
      fs.unlinkSync(filePath);
      console.log(`✅ Удален: ${fileName}`);
    }

    console.log('\n✅ Очистка ненужных файлов завершена');
  } catch (error) {
    console.error('❌ Ошибка при очистке файлов:', error);
  } finally {
    // if (client) {
    //   client.end(); // Закрываем соединение с базой данных
      console.log('🔌 Соединение с базой данных не закрыто.');
    // }
  }
}

// Запускаем скрипт, если он вызывается напрямую
if (require.main === module) {
  cleanUnusedFiles();
} else {
  module.exports = cleanUnusedFiles;
}