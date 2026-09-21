(function redirectAuthenticatedUser() {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch('/market/verify-token', {
        credentials: 'include',
        headers
    })
        .then(response => {
            if (response.ok) {
                window.location.replace('/account');
                return;
            }

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('jwt');
                localStorage.removeItem('user');
                sessionStorage.removeItem('jwt');
                sessionStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.warn('Не удалось проверить текущую сессию:', error);
        });
})();
