(async function redirectAuthenticatedUser() {
    // Only authentication forms may redirect after a confirmed login.
    if (!/\/pages\/user-auth\/(login|register)\.html$/.test(location.pathname)) return;
    try {
        const { user } = await window.PlglAuth.session;
        if (!user) return;
        const saved = sessionStorage.getItem('plgl-return-to');
        sessionStorage.removeItem('plgl-return-to');
        const target = saved ? new URL(saved, location.origin) : null;
        location.replace(target && target.origin === location.origin && !/\/user-auth\//.test(target.pathname) ? target.href : '/pages/index.html');
    } catch(error) { console.warn('Не удалось проверить вход:', error); }
})();
