// Shared URL rules for EJS and browser-rendered cards.
(function (root) {
    const fallbackAvatar = '/assets/images/pl-gl-default-avatar.svg';
    function avatarUrl(value) {
        const source = String(value || '').trim();
        if (!source || source.includes('account_circle_')) return fallbackAvatar;
        if (/^https?:\/\//i.test(source)) return source;
        const clean = source.replace(/^(\.\.\/|\.\/)+/, '').replace(/^\/+/, '');
        return /^(market\/uploads|uploads|assets|images)\//.test(clean) ? '/' + clean : fallbackAvatar;
    }
    function coverUrl(value, fallback = fallbackAvatar) {
        const source = String(value || '').trim();
        if (!source) return fallback;
        if (/^https?:\/\//i.test(source)) return source;
        if (source.startsWith('/market/uploads/')) return source;
        return '/market/uploads/' + encodeURIComponent(source.split(/[\\/]/).pop());
    }
    const api = { avatarUrl, coverUrl, fallbackAvatar };
    if (typeof module === 'object' && module.exports) { module.exports = api; return; }
    if (root.PlglMedia) return;
    root.PlglMedia = api;
    const requests = new Map();
    api.channel = id => {
        if (!requests.has(String(id))) requests.set(String(id), fetch('/market/listings/' + encodeURIComponent(id) + '/media')
            .then(async response => { if (!response.ok) throw new Error('Изображение временно недоступно'); return response.json(); }));
        return requests.get(String(id));
    };
    api.hydrate = (scope = document) => {
        scope.querySelectorAll('img[data-channel-id]:not([data-media-loaded])').forEach(img => {
            img.dataset.mediaLoaded = 'true';
            api.channel(img.dataset.channelId).then(data => {
                if (!img.isConnected) return;
                if (data.avatar) {
                    const candidate = new Image();
                    candidate.onload = () => { img.src = candidate.src; img.closest('.card-art')?.classList.add('card-art-avatar'); };
                    candidate.src = data.avatar;
                }
                if (data.subscribers != null) scope.querySelectorAll('[data-subscribers-id]').forEach(el => {
                    if (el.dataset.subscribersId === img.dataset.channelId) el.textContent = Number(data.subscribers).toLocaleString('ru-RU');
                });
            }).catch(() => {});
        });
    };
    document.addEventListener('error', event => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) || !img.dataset.fallback) return;
        const fallback = img.dataset.fallback;
        delete img.dataset.fallback;
        img.src = fallback;
    }, true);
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('img[data-fallback]').forEach(img => {
            if (img.complete && !img.naturalWidth) img.dispatchEvent(new Event('error'));
        });
        api.hydrate();
    });
})(typeof window === 'undefined' ? globalThis : window);
