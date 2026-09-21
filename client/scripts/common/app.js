(() => {
    if (window.PlglAuth) return;
    const nativeFetch = window.fetch.bind(window);
    const authPage = /\/pages\/user-auth\/(login|register)\.html$/.test(location.pathname);
    const token = () => sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
    let redirecting = false;
    function login(message = 'Для просмотра страницы необходимо войти в аккаунт.') {
        if (authPage || redirecting) return;
        redirecting = true;
        sessionStorage.setItem('plgl-login-notice', message);
        sessionStorage.setItem('plgl-return-to', location.pathname + location.search + location.hash);
        window.PlglNotifications?.show(message, 'error');
        location.replace('/pages/user-auth/login.html');
    }
    const session = nativeFetch('/account/session', { credentials: 'include', cache: 'no-store', headers: token() ? { Authorization: 'Bearer ' + token() } : {} })
        .then(async res => { if (!res.ok) throw new Error('Не удалось проверить вход. Обновите страницу.'); return res.json(); });
    session.catch(() => {});
    window.PlglAuth = {
        session, login,
        async require() {
            const { user } = await session;
            if (!user) { login(); return false; }
            return true;
        }
    };
    // Existing API modules keep their business logic; the shared layer handles
    // credentials and an expired session consistently on every page.
    window.fetch = async (input, options = {}) => {
        const url = new URL(input instanceof Request ? input.url : input, location.href);
        if (url.origin !== location.origin) return nativeFetch(input, options);
        const headers = new Headers(options.headers || (input instanceof Request ? input.headers : undefined));
        if (token()) headers.set('Authorization', 'Bearer ' + token());
        const response = await nativeFetch(input, { ...options, credentials: 'include', headers });
        if (response.status === 401 && !authPage) login('Сессия завершена. Войдите в аккаунт снова.');
        return response;
    };
    class NotificationCenter {
        constructor() {
            this.region = document.createElement('div');
            this.region.className = 'plgl-toasts';
            this.region.setAttribute('aria-live', 'polite');
            document.body.append(this.region);
        }
        show(message, type = 'info') {
            const item = document.createElement('div');
            item.className = 'plgl-toast ' + type;
            item.textContent = message;
            this.region.append(item);
            setTimeout(() => item.remove(), 6500);
        }
        mount() {
            this.button = document.createElement('button');
            this.button.className = 'plgl-notification-toggle';
            this.button.type = 'button';
            this.button.textContent = 'Уведомления';
            this.button.setAttribute('aria-expanded', 'false');
            this.panel = document.createElement('section');
            this.panel.className = 'plgl-notification-panel';
            this.panel.hidden = true;
            this.panel.setAttribute('aria-label', 'Уведомления');
            const heading = document.createElement('h2');
            heading.textContent = 'Уведомления';
            const close = document.createElement('button');
            close.textContent = 'Закрыть';
            close.addEventListener('click', () => this.close());
            const all = document.createElement('button');
            all.textContent = 'Прочитать все';
            all.addEventListener('click', async () => {
                try { await this.api('/read-all', { method: 'POST' }); await this.load(); }
                catch (error) { this.show(error.message, 'error'); }
            });
            this.list = document.createElement('div');
            this.panel.append(heading, close, all, this.list);
            document.body.append(this.button, this.panel);
            this.button.addEventListener('click', () => {
                this.panel.hidden = !this.panel.hidden;
                this.button.setAttribute('aria-expanded', String(!this.panel.hidden));
                if (!this.panel.hidden) { close.focus(); this.load(); }
            });
            document.addEventListener('keydown', event => { if (event.key === 'Escape' && !this.panel.hidden) this.close(); });
            this.load();
            this.timer = setInterval(() => { if (!document.hidden) this.load(this.panel.hidden); }, 60000);
        }
        close() { this.panel.hidden = true; this.button.setAttribute('aria-expanded', 'false'); this.button.focus(); }
        async api(path = '', options) {
            const res = await fetch('/account/notifications' + path, options);
            if (!res.ok) throw new Error('Не удалось обновить уведомления.');
            return res.json();
        }
        async load(countOnly = false, cursor = null) {
            try {
                const data = await this.api(cursor ? '?before=' + encodeURIComponent(cursor) : '');
                this.button.textContent = data.unread ? 'Уведомления · ' + data.unread : 'Уведомления';
                if (countOnly) return;
                if (!cursor) this.list.replaceChildren();
                if (!data.items.length && !cursor) this.list.textContent = 'Новых уведомлений пока нет.';
                for (const item of data.items) {
                    const row = document.createElement('article');
                    row.className = item.readAt ? 'plgl-notice' : 'plgl-notice unread';
                    const title = document.createElement('strong'); title.textContent = item.title;
                    const message = document.createElement('p'); message.textContent = item.message;
                    const date = document.createElement('time'); date.textContent = new Date(item.createdAt).toLocaleString('ru-RU');
                    const open = document.createElement('button'); open.textContent = 'Открыть';
                    open.addEventListener('click', async () => {
                        try {
                            await this.api('/' + encodeURIComponent(item.id) + '/read', { method: 'POST' });
                            const url = new URL(item.url, location.origin);
                            if (url.origin === location.origin) location.assign(url.href);
                        } catch(error) { this.show(error.message, 'error'); }
                    });
                    row.append(title, message, date, open);
                    this.list.append(row);
                }
                if (data.nextCursor) {
                    const more = document.createElement('button'); more.textContent = 'Загрузить ещё';
                    more.addEventListener('click', () => { more.remove(); this.load(false, data.nextCursor); });
                    this.list.append(more);
                }
            } catch(error) {
                if (!countOnly) {
                    this.list.textContent = error.message;
                    const retry = document.createElement('button'); retry.textContent = 'Повторить';
                    retry.addEventListener('click', () => this.load()); this.list.append(retry);
                }
            }
        }
    }
    const style = document.createElement('link');
    style.rel = 'stylesheet'; style.href = '/assets/styles/common/app.css?v=1'; document.head.append(style);
    if (!authPage) document.documentElement.classList.add('plgl-checking-auth');
    document.addEventListener('DOMContentLoaded', async () => {
        const center = new NotificationCenter();
        window.PlglNotifications = center;
        const notice = sessionStorage.getItem('plgl-login-notice');
        if (authPage && notice) { center.show(notice, 'error'); sessionStorage.removeItem('plgl-login-notice'); }
        try {
            const { user } = await session;
            if (!user && !authPage) { login(); return; }
            if (user && window.plglAuthShell) {
                const last = Number(sessionStorage.getItem('plgl-cookie-retry') || 0);
                if (Date.now() - last < 10000) throw new Error('Не удалось сохранить вход. Разрешите cookies для сайта и повторите попытку.');
                sessionStorage.setItem('plgl-cookie-retry', String(Date.now()));
                location.reload(); return;
            }
            sessionStorage.removeItem('plgl-cookie-retry');
            document.documentElement.classList.remove('plgl-checking-auth');
            if (user) {
                document.querySelectorAll('[data-viewer-name]').forEach(el => { el.textContent = user.nickname; });
                document.querySelectorAll('[data-viewer-avatar]').forEach(el => {
                    el.src = user.avatar && !user.avatar.startsWith('../') ? user.avatar : '/assets/images/pl-gl-default-avatar.svg';
                    el.addEventListener('error', () => { el.src = '/assets/images/pl-gl-default-avatar.svg'; }, { once: true });
                });
                document.querySelectorAll('[data-viewer-premium]').forEach(el => { el.hidden = user.is_premium !== true; });
                center.mount();
            }
        } catch(error) {
            document.documentElement.classList.remove('plgl-checking-auth');
            if (!authPage) {
                const errorPanel = document.createElement('main');
                errorPanel.className = 'plgl-session-error';
                errorPanel.textContent = error.message;
                const retry = document.createElement('button'); retry.textContent = 'Повторить';
                retry.addEventListener('click', () => location.reload()); errorPanel.append(retry);
                document.body.replaceChildren(errorPanel);
            }
        }
    });
    document.addEventListener('click', async event => {
        const logout = event.target.closest('#logout-button');
        if (logout) {
            event.preventDefault(); event.stopImmediatePropagation();
            try {
                const res = await nativeFetch('/account/logout', { method:'POST',credentials:'include' });
                if (!res.ok) throw new Error();
                for (const storage of [localStorage,sessionStorage]) { storage.removeItem('jwt'); storage.removeItem('user'); }
                location.assign('/pages/user-auth/login.html');
            } catch { window.PlglNotifications?.show('Не удалось выйти. Попробуйте ещё раз.', 'error'); }
        }
    }, true);
})();
