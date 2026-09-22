(() => {
    if (window.PlglAuth) return;
    const nativeFetch = window.fetch.bind(window);
    const authPage = /\/pages\/user-auth\/(login|register)\.html$/.test(location.pathname);
    const token = () => sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
    let redirecting = false;
    function login(message = 'Для просмотра страницы необходимо войти в аккаунт.') {
        if (authPage || redirecting) return;
        redirecting = true;
        localStorage.removeItem('jwt');
        sessionStorage.removeItem('jwt');
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        // The storage token is required even if an old HttpOnly cookie remains.
        nativeFetch('/account/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {});
        sessionStorage.setItem('plgl-login-notice', message);
        sessionStorage.setItem('plgl-return-to', location.pathname + location.search + location.hash);
        window.PlglNotifications?.show(message, 'error');
        location.replace('/pages/user-auth/login.html');
    }
    const session = token() ? nativeFetch('/account/session', { credentials: 'include', cache: 'no-store', headers: { Authorization: 'Bearer ' + token() } })
        .then(async res => { if (res.status === 401) return { user: null }; if (!res.ok) throw new Error('Не удалось проверить вход. Обновите страницу.'); return res.json(); })
        : Promise.resolve({ user: null });
    session.catch(() => {});
    window.PlglAuth = {
        session, login,
        async require() {
            if (!token()) { login(); return false; }
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
        if (!authPage && !token()) {
            login('Вы вышли из аккаунта. Войдите снова.');
            return new Response(JSON.stringify({ error: 'Необходим вход' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
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
            this.button.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg><span class="plgl-notification-count" hidden></span>';
            this.button.setAttribute('aria-label', 'Уведомления');
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
            let nav = document.querySelector('.pl-header-inner')
                || document.querySelector('.nav-container')
                || document.querySelector('header nav')
                || document.querySelector('header');
            if (!nav) {
                nav = document.createElement('nav');
                nav.className = 'plgl-navigation-bar';
                nav.innerHTML = '<a href="/pages/index.html">Каталог PL-GL</a>';
                document.body.prepend(nav);
            }
            const slot = document.createElement('span');
            slot.className = 'plgl-notification-slot';
            slot.append(this.button);
            const burger = nav.querySelector('#menu-icon');
            if (burger && burger.parentElement === nav) nav.insertBefore(slot, burger);
            else nav.append(slot);
            document.body.append(this.panel);
            this.button.addEventListener('click', () => {
                this.panel.hidden = !this.panel.hidden;
                this.button.setAttribute('aria-expanded', String(!this.panel.hidden));
                if (!this.panel.hidden) {
                    this.panel.style.top = Math.min(this.button.getBoundingClientRect().bottom + 10, 120) + 'px';
                    close.focus(); this.load();
                }
            });
            document.addEventListener('click', event => {
                if (!this.panel.hidden && !this.panel.contains(event.target) && !this.button.contains(event.target)) this.close();
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
                const badge = this.button.querySelector('.plgl-notification-count');
                badge.hidden = !data.unread;
                badge.textContent = data.unread > 99 ? '99+' : data.unread;
                this.button.setAttribute('aria-label', data.unread ? 'Уведомления: ' + data.unread + ' непрочитанных' : 'Уведомления');
                if (countOnly) return;
                if (!cursor) this.list.replaceChildren();
                if (!data.items.length && !cursor) this.list.textContent = 'Новых уведомлений пока нет.';
                for (const item of data.items) {
                    if (item.eventKey === 'welcome' && !item.readAt && !sessionStorage.getItem('plgl-welcome-' + item.id)) {
                        sessionStorage.setItem('plgl-welcome-' + item.id, 'shown');
                        this.show(item.message);
                    }
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
    style.rel = 'stylesheet'; style.href = '/assets/styles/common/app.css?v=2'; document.head.append(style);
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
                document.querySelectorAll('#login-item,#register-item').forEach(el => { el.style.display = 'none'; });
                document.querySelectorAll('#account-item,#sell-item').forEach(el => { el.style.display = 'block'; });
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
    const checkStorage = () => { if (!authPage && !token()) login('Для просмотра страницы необходимо войти в аккаунт.'); };
    for (const event of ['storage', 'hashchange', 'pageshow', 'focus']) window.addEventListener(event, checkStorage);
    if (!authPage) setInterval(checkStorage, 2000);
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
