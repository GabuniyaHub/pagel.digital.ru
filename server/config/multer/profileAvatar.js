const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
// This directory is served at /market/uploads/avatars/custom by server.js.
const directory = path.join(__dirname, '../../routes/uploads/avatars/custom');
fs.mkdirSync(directory, { recursive: true });
const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
    storage: multer.diskStorage({
        destination: directory,
        filename: (req, file, done) => done(null, randomUUID() + extensions[file.mimetype])
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, done) => extensions[file.mimetype]
        ? done(null, true) : done(new Error('Выберите JPG, PNG или WebP.'))
}).single('avatar');
module.exports = (req, res, next) => upload(req, res, error => {
    if (!error) return next();
    res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Аватар должен быть не больше 5 МБ.' : 'Не удалось загрузить изображение. Используйте JPG, PNG или WebP до 5 МБ.' });
});
