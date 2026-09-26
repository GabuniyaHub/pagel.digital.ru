const media = require('../../client/scripts/common/media');
const categories = require('../config/market/youtubeCatalog');
const { themes } = require('./marketCatalog');

function contactLinks(contacts = {}) {
    const links = [];
    const telegram = String(contacts.telegram || '').trim().replace(/^https?:\/\/(t\.me|telegram\.me)\//i, '').replace(/^@/, '');
    if (/^[a-zA-Z0-9_]{3,32}$/.test(telegram)) links.push({ label: 'Telegram', value: '@' + telegram, href: 'https://t.me/' + telegram });
    const email = String(contacts.email || contacts['e-mail'] || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) links.push({ label: 'E-mail', value: email, href: 'mailto:' + encodeURIComponent(email) });
    const phone = String(contacts.whatsapp || '').replace(/\D/g, '');
    if (/^\d{7,15}$/.test(phone)) links.push({ label: 'WhatsApp', value: '+' + phone, href: 'https://wa.me/' + phone });
    return links;
}
function detailView(listing, comments) {
    const channel = Number(listing.form_type) === 1;
    const category = categories.find(item => item.name === listing.category_name) || { id: channel ? 'channel-buy' : 'other-services', description: listing.category_name };
    const byId = new Map(comments.map(comment => [String(comment.id), comment]));
    // Flat reply indentation keeps long conversations readable on mobile.
    const roots = comments.filter(comment => !comment.parent_id || !byId.has(String(comment.parent_id)));
    const replies = new Map();
    comments.forEach(comment => {
        if (!comment.parent_id || !byId.has(String(comment.parent_id))) return;
        let parent = byId.get(String(comment.parent_id));
        const seen = new Set([String(comment.id)]);
        while (parent.parent_id && byId.has(String(parent.parent_id)) && !seen.has(String(parent.id))) {
            seen.add(String(parent.id)); parent = byId.get(String(parent.parent_id));
        }
        const key = String(parent.id);
        if (!replies.has(key)) replies.set(key, []);
        replies.get(key).push({ ...comment, replyingTo: byId.get(String(comment.parent_id)).author_name || 'Пользователь' });
    });
    return {
        channel, category, media, themes,
        theme: themes[Number(listing.theme) - 1] || listing.theme || 'Не указана',
        catalogPath: '/market/' + encodeURIComponent(listing.platform_slug) + '/' + category.id,
        sellUrl: '/pages/market/sell.html?type=' + (channel ? 'channel' : 'service'),
        contacts: contactLinks(listing.user?.contacts),
        threads: roots.reverse().map(comment => ({ ...comment, replies: replies.get(String(comment.id)) || [] })),
        number: value => Number(value || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 }),
        date: value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Дата не указана'
    };
}
module.exports = { detailView, contactLinks };
