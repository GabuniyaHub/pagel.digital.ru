// <!-- Добавить в избранное -->
async function toggleFavorite(listingId) {
    const token = sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
    // const userString = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (!token) {
        return Swal.fire('Ошибка', 'Необходимо войти в аккаунт!', 'warning');
    }

    try {
        // const user = JSON.parse(userString);
        // const userId = user.id;

        const res = await fetch('/market/add/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                listingId
                // userId
            })
        })

        const data = await res.json();

        if (res.ok) {
            Swal.fire('Успешно', data.message, 'success');
            //  обновить иконку
            const btn = document.querySelector(`[data-listing-id="${listingId}"]`);
            const icon = btn.querySelector('i');
            // Переключаем состояние
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
            // Меняем текст
            btn.innerHTML = btn.innerHTML.includes('Добавить')
                ? '<i class="fas fa-heart"></i> В избранном'
                : '<i class="far fa-heart"></i> Добавить в избранное';

        } else {
            Swal.fire('Ошибка', data.message || 'Ошибка сервера', 'error');
        }
    } catch (err) {
        Swal.fire('Ошибка', 'Сервер недоступен', 'error');
    }
}