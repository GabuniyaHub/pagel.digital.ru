document.addEventListener('DOMContentLoaded', async () => {
    const userInfoContainer = document.getElementById('user-info-container');

    if (userInfoContainer) {

        const userId = userInfoContainer.dataset.userId;

        if (userId) {

            try {
                const response = await fetch(`/market/get/user/${userId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                const user = await response.json();

                const usernamePlaceholder = document.getElementById('username-placeholder');
                const avatarPlaceholder = document.getElementById('avatar-placeholder');
                const ratingPlaceholder = document.getElementById('rating-placeholder');
                const descriptionPlaceholder = document.getElementById('description-placeholder');

                if (usernamePlaceholder) {
                    usernamePlaceholder.textContent = user.nickname;
                }

                if (avatarPlaceholder) {
                    avatarPlaceholder.src = user.avatar;
                    avatarPlaceholder.style.display = 'block'; // Показываем аватар
                }

                if (ratingPlaceholder) {
                    ratingPlaceholder.textContent = `Рейтинг: ${user.rating}`;
                }
                if (descriptionPlaceholder) {
                    descriptionPlaceholder.textContent = `Описание: ${user.description}`;
                }

            } catch (error) {
                console.error('Ошибка при загрузке информации о пользователе:', error);
                const usernamePlaceholder = document.getElementById('username-placeholder');
                if (usernamePlaceholder) {
                    usernamePlaceholder.textContent = 'Ошибка загрузки пользователя';
                }
            }
        } else {
            console.warn('User ID не найден в data-user-id.');
            const usernamePlaceholder = document.getElementById('username-placeholder');
            if (usernamePlaceholder) {
                usernamePlaceholder.textContent = 'Неизвестный пользователь';
            }
        }
    } else {
        console.warn('Контейнер информации о пользователе не найден.');
    }

});