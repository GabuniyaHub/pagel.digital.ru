export const defaultAvatar = '/assets/images/pl-gl-default-avatar.svg';
export const contactNames = ['telegram', 'email', 'whatsapp'];
export function normalizeContacts(value) {
    try {
        if (typeof value === 'string') value = JSON.parse(value);
        if (typeof value === 'string') value = JSON.parse(value);
    } catch { value = {}; }
    return Object.fromEntries(contactNames.map(name => [name, typeof value?.[name] === 'string' ? value[name].trim() : '']));
}
export function applyBadges(user) {
    const enabled = value => value === true || value === 1 || value === 'true';
    document.querySelectorAll('.badge-verified').forEach(el => { el.hidden = !enabled(user.verified); });
    document.querySelectorAll('.premium').forEach(el => { el.hidden = !enabled(user.is_premium); });
}
export function renderProfileContacts(value) {
    const container = document.getElementById('contacts');
    if (!container) return;
    container.replaceChildren();
    const labels = { telegram: 'Telegram', email: 'Email', whatsapp: 'WhatsApp' };
    Object.entries(normalizeContacts(value)).forEach(([type, contact]) => {
        if (!contact) return;
        const link = document.createElement('a');
        link.className = 'profile-contact';
        if (type === 'telegram') link.href = 'https://t.me/' + encodeURIComponent(contact.replace(/^https?:\/\/(?:www\.)?t\.me\//i, '').replace(/^@/, ''));
        if (type === 'email') link.href = 'mailto:' + encodeURIComponent(contact);
        if (type === 'whatsapp') link.href = 'https://wa.me/' + contact.replace(/\D/g, '');
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        const title = document.createElement('strong');
        title.textContent = labels[type];
        const detail = document.createElement('span');
        detail.textContent = contact;
        link.append(title, detail);
        container.append(link);
    });
    if (!container.children.length) {
        const empty = document.createElement('p');
        empty.textContent = 'Контакты пока не указаны.';
        container.append(empty);
    }
}
