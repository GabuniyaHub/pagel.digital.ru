const Notification = require('../models/Notification');
class NotificationService {
    constructor(db) { this.db = db; }
    async welcome(userId) {
        await this.db.query(
            `INSERT INTO notifications (user_id, title, message, url, event_key)
             VALUES ($1, $2, $3, $4, 'welcome')
             ON CONFLICT (user_id, event_key) WHERE event_key IS NOT NULL DO NOTHING`,
            [userId, 'Добро пожаловать в PL-GL!',
             'PL-GL объединяет две стороны рынка: здесь можно найти нужного специалиста или предложить собственные услуги для YouTube.',
             '/pages/index.html']
        );
    }
    async create(userId, { title, message, url = '/account' }) {
        if (!Number.isInteger(Number(userId)) || Number(userId) < 1) throw new Error('Invalid notification recipient');
        if (!title || !message || !url.startsWith('/') || url.startsWith('//')) throw new Error('Invalid notification');
        const { rows } = await this.db.query(
            'INSERT INTO notifications (user_id, title, message, url) VALUES ($1,$2,$3,$4) RETURNING *',
            [userId, title.slice(0, 160), message.slice(0, 2000), url]
        );
        return new Notification(rows[0]);
    }
    async list(userId, before) {
        const { rows } = await this.db.query(
            'SELECT * FROM notifications WHERE user_id=$1 AND ($2::bigint IS NULL OR id<$2) ORDER BY id DESC LIMIT 30',
            [userId, before || null]
        );
        const count = await this.db.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND read_at IS NULL', [userId]);
        return { items: rows.map(row => new Notification(row)), unread: count.rows[0].count, nextCursor: rows.length === 30 ? rows[29].id : null };
    }
    async markRead(userId, id) {
        const { rows } = await this.db.query('UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE user_id=$1 AND id=$2 RETURNING *', [userId, id]);
        return rows[0] ? new Notification(rows[0]) : null;
    }
    async markAllRead(userId) {
        await this.db.query('UPDATE notifications SET read_at=NOW() WHERE user_id=$1 AND read_at IS NULL', [userId]);
    }
}
module.exports = NotificationService;
