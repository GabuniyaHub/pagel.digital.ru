export function checkAuth() {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');

    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Авторизация',
            text: 'Пожалуйста, войдите в систему, чтобы продолжить.',
            confirmButtonText: 'ОК'
        }).then(() => {
            window.location.href = '/pages/user-auth/login.html';
        });
        return new Promise((_, reject) => reject(new Error("No token found"))); 
    }

    return fetch('/market/verify-token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(async response => {
        if (response.status === 401 || response.status === 403) {
            Swal.fire({
                icon: 'warning',
                title: 'Авторизация',
                text: 'Сессия истекла. Пожалуйста, войдите снова.',
                confirmButtonText: 'ОК'
            }).then(() => {
                window.location.href = '/pages/user-auth/login.html';
            });
            throw new Error('Unauthorized or Forbidden'); 
        }

        if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.user_id; 
    })
    .catch(error => {
        console.warn('Ошибка проверки авторизации:', error);
        if (error.message !== 'Unauthorized or Forbidden') { 
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: 'Произошла ошибка при проверке авторизации. Пожалуйста, попробуйте снова.',
                confirmButtonText: 'ОК'
            }).then(() => {
                window.location.href = '/pages/user-auth/login.html';
            });
        }
        throw error; 
    });
}