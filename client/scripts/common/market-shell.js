document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('profile-menu-toggle');
    const menu = document.getElementById('profile-menu');
    function closeMenu(focus = false) {
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (focus) toggle.focus();
    }
    toggle.addEventListener('click', () => {
        menu.hidden = !menu.hidden;
        toggle.setAttribute('aria-expanded', String(!menu.hidden));
    });
    menu.addEventListener('click', event => { if (event.target.closest('.select-favorites,.settings-link')) closeMenu(); });
    document.addEventListener('click', event => { if (!event.target.closest('.pl-profile')) closeMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) closeMenu(true); });
    document.getElementById('catalog-logout').addEventListener('click', async () => {
        try { await fetch('/account/logout', { method: 'POST' }); } catch {}
        ['jwt', 'user'].forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
        location.assign('/pages/user-auth/login.html');
    });
    try {
        if (!await window.PlglAuth.require()) return;
        const { user } = await window.PlglAuth.session;
        document.getElementById('header-user-name').textContent = user.nickname || 'Профиль';
        const avatar = document.getElementById('header-avatar');
        avatar.dataset.fallback = '/assets/images/pl-gl-default-avatar.svg';
        avatar.src = window.PlglMedia.avatarUrl(user.avatar);
    } catch { window.PlglNotifications?.show('Не удалось загрузить профиль. Обновите страницу.', 'error'); }
});
