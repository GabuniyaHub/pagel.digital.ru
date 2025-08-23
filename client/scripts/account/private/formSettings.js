import { getData } from './getData.js';
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await getData();
        if (!data) throw new Error('Нет данных для отображения');
        // console.log('Данные загружены:', data);

        // Подставляем данные пользователя
        const user = data.user;
        const listings = data.listings;
        const reviews = data.reviews;
        const favorites = data.favorites;
        const categories = data.categories;
        const platforms = data.platforms;

        // элементы формы
        const nameInput = document.querySelector('#settings .settings-form input[type="text"]:nth-of-type(1)');
        const descTextarea = document.querySelector('#settings .settings-form textarea');
        const avatarInput = document.querySelector('#settings .settings-form input[type="text"]:nth-of-type(2)');
        const avatarFileInput = document.getElementById('avatar-file');
        const avatarImage = document.getElementById('avatar-image');
        const saveBtn = document.querySelector('#settings .settings-form button[type="submit"]');

        const telegramInput = document.querySelector('input[name="telegram"]');
        const emailInput = document.querySelector('input[name="email"]');
        const whatsappInput = document.querySelector('input[name="whatsapp"]');
        const vkInput = document.querySelector('input[name="vk"]');
        const instagramInput = document.querySelector('input[name="instagram"]');


        if (nameInput) nameInput.value = user.nickname || '';
        if (descTextarea) descTextarea.value = user.description || 'Начинающий продавец';
        if (avatarInput) avatarInput.value = user.avatar || '';
        if (avatarImage && user.avatar) avatarImage.src = user.avatar;

        if (telegramInput) telegramInput.value = user.contacts.telegram || '';
        if (emailInput) emailInput.value = user.contacts.email || '';
        if (whatsappInput) whatsappInput.value = user.contacts.whatsapp || '';
        if (vkInput) vkInput.value = user.contacts.vk || '';
        if (instagramInput) instagramInput.value = user.contacts.instagram || '';
        
        // console.log('Элементы формы:', {
        //     nameInput,
        //     descTextarea,
        //     avatarInput,
        //     avatarFileInput,
        //     avatarImage,
        //     saveBtn
        // });

        // Смена аватарки (предпросмотр)
        avatarFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 200; // например, 200x200
                    canvas.width = size;
                    canvas.height = size;

                    const ctx = canvas.getContext('2d');

                    // Пропорционально вписываем изображение и центрируем
                    const scale = Math.max(size / img.width, size / img.height);
                    const x = (size - img.width * scale) / 2;
                    const y = (size - img.height * scale) / 2;

                    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                    // Превью
                    avatarImage.src = canvas.toDataURL('image/jpeg', 0.8);

                    // Можно создать Blob для отправки
                    canvas.toBlob((blob) => {
                        formData.append('avatar', blob, file.name);
                    }, 'image/jpeg', 0.8);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });


        // Клик по аватарке = открытие выбора файла
        document.querySelector('.avatar-wrapper').addEventListener('click', () => {
            avatarFileInput.click();
        });

        // Обработка сохранения
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            const form = document.querySelector('#settings .settings-form');

            // Собираем контакты
            const contacts = {
                telegram: form.querySelector('input[name="telegram"]').value.trim() || null,
                vk: form.querySelector('input[name="vk"]').value.trim() || null,
                instagram: form.querySelector('input[name="instagram"]').value.trim() || null,
                whatsapp: form.querySelector('input[name="whatsapp"]').value.trim() || null,
                email: form.querySelector('input[name="email"]').value.trim() || null
            };

            // Проверка: хотя бы одно поле должно быть заполнено
            if (!Object.values(contacts).some(value => value !== null)) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Контактные данные обязательны',
                    text: 'Пожалуйста, заполните хотя бы одно поле для связи.'
                });
            }

            // Валидация каждого поля, если оно заполнено
            if (contacts.telegram && !/^@?[a-zA-Z0-9_]{5,32}$/.test(contacts.telegram)) {
                return Swal.fire({ icon: 'error', title: 'Неверный Telegram', text: 'Введите корректный Telegram username (от 5 до 32 символов).' });
            }

            if (contacts.vk && !/^https?:\/\/(www\.)?vk\.com\/[a-zA-Z0-9_.]+$/.test(contacts.vk)) {
                return Swal.fire({ icon: 'error', title: 'Неверная ссылка VK', text: 'Укажите ссылку на профиль VK (например, https://vk.com/id12345).' });
            }

            if (contacts.instagram && !/^@?[a-zA-Z0-9_.]{1,30}$/.test(contacts.instagram)) {
                return Swal.fire({ icon: 'error', title: 'Неверный Instagram', text: 'Введите корректный Instagram username (до 30 символов).' });
            }

            if (contacts.whatsapp && !/^\+?[0-9\s\-\(\)]{7,20}$/.test(contacts.whatsapp)) {
                return Swal.fire({ icon: 'error', title: 'Неверный номер WhatsApp', text: 'Введите корректный номер телефона.' });
            }

            if (contacts.email && !/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/.test(contacts.email)) {
                return Swal.fire({ icon: 'error', title: 'Неверный Email', text: 'Введите корректный адрес электронной почты.' });
            }

            // Добавляем контакты в formData
            formData.append('contacts', JSON.stringify(contacts));

            // Добавляем текстовые данные
            formData.append('nickname', nameInput.value.trim());
            formData.append('description', descTextarea.value.trim());

            // Если выбрана новая аватарка — добавляем файл
            if (avatarFileInput.files.length > 0) {
                formData.append('avatar', avatarFileInput.files[0]);
            } else {
                formData.append('avatar', avatarImage.src);
            }

            console.log('Данные для отправки:', Array.from(formData.entries()));
            
            try {
                const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');

                const res = await fetch('/account/save-settings', { 
                    method: 'POST', 
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: formData 
                });

                const result = await res.json();
                console.log('Ответ сервера:', result);
                if (res.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Настройки сохранены',
                        text: result.message || 'Ваши настройки успешно обновлены!'
                    });
                    // Обновляем аватарку на странице
                    // avatarImage.src = result.avatar || '/market/uploads/default-avatar.png';
                    location.reload(); // перезагружаем страницу для обновления данных
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        text: result.error || 'Не удалось сохранить настройки. Попробуйте позже.'
                    });
                }
            } catch (err) {
                console.error('Ошибка при сохранении настроек:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Не удалось сохранить настройки. Попробуйте позже.'
                });
            }
        });

    } catch (err) {
        console.error('Ошибка при получении данных:', err);
        Swal.fire({
            icon: 'error',
            title: 'Ошибка',
            text: 'Не удалось загрузить данные профиля. Попробуйте позже.'
        });
    }
});