const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');
const notifications = require('../services/notifications');
router.use(verifyToken);
router.get('/', async (req, res) => {
    if (req.query.before && !/^[1-9]\d*$/.test(req.query.before)) return res.status(400).json({ error: 'Неверный курсор' });
    try { res.set('Cache-Control', 'no-store'); res.json(await notifications.list(req.user.id, req.query.before)); }
    catch (error) { console.error('Notifications:', error); res.status(500).json({ error: 'Не удалось загрузить уведомления' }); }
});
router.post('/read-all', async (req, res) => {
    try { await notifications.markAllRead(req.user.id); res.json({ success: true }); }
    catch { res.status(500).json({ error: 'Не удалось обновить уведомления' }); }
});
router.post('/:id/read', async (req, res) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Неверный номер уведомления' });
    try {
        const item = await notifications.markRead(req.user.id, req.params.id);
        if (!item) return res.status(404).json({ error: 'Уведомление не найдено' });
        res.json({ item });
    } catch { res.status(500).json({ error: 'Не удалось обновить уведомление' }); }
});
module.exports = router;
