const optionalAuth = require('./MarketMiddleware/optionalAuth');
// A browser navigation cannot send localStorage as Authorization. Return only
// a neutral shell until the client exchanges its valid bearer token for a cookie.
module.exports = (req, res, next) => {
    if (req.method !== 'GET' || ['/pages/user-auth/login.html', '/pages/user-auth/register.html'].includes(req.path)) return next();
    const page = req.path === '/' || /\.(html|ejs)$/.test(req.path) || (req.headers.accept || '').includes('text/html');
    if (!page) return next();
    optionalAuth(req, res, () => {
        res.set('Cache-Control', 'no-store');
        if (req.user) return next();
        res.type('html').send('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вход в PL-GL</title><script>window.plglAuthShell=true;</script><script src="/scripts/common/app.js?v=1"></script></head><body><p>Проверяем вход…</p><noscript>Для входа включите JavaScript.</noscript></body></html>');
    });
};
