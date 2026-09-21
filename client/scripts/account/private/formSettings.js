import { getData } from './getData.js';

function showError(title, text) {
    return Swal.fire({ icon: 'error', title, text });
}

function validateContacts(contacts) {
    if (!Object.values(contacts).some(Boolean)) return 'Укажите хотя бы один способ связи.';
    if (contacts.telegram && !/^@?[a-zA-Z0-9_]{5,32}$/.test(contacts.telegram)) return 'Проверьте username Telegram.';
    if (contacts.vk && !/^(https?:\/\/)?(www\.)?vk\.com\/[a-zA-Z0-9_.]+$/.test(contacts.vk)) return 'Укажите корректную ссылку VK.';
    if (contacts.instagram && !/^@?[a-zA-Z0-9_.]{1,30}$/.test(contacts.instagram)) return 'Проверьте username Instagram.';
    if (contacts.whatsapp && !/^\+?[0-9\s\-()]{7,20}$/.test(contacts.whatsapp)) return 'Проверьте номер WhatsApp.';
    if (contacts.email && !/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(contacts.email)) return 'Проверьте адрес email.';
    return null;
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.querySelector('#settings .settings-form');
    const avatarInput = document.getElementById('avatar-file');
    const avatarImage = document.getElementById('avatar-image');
    const avatarPicker = document.getElementById('avatar-picker') || document.querySelector('.avatar-wrapper');
    if (!form || !avatarInput || !avatarImage || !avatarPicker) return;
    const nicknameInput = form.elements.nickname || form.querySelector('input[type="text"]');
    const descriptionInput = form.elements.description || form.querySelector('textarea');
    let avatarValue = '/assets/images/pl-gl-default-avatar.svg';

    try {
        const data = await getData();
        const user = data?.user;
        if (!user) throw new Error('Нет данных пользователя');
        nicknameInput.value = user.nickname || '';
        descriptionInput.value = user.description || '';
        const contacts = user.contacts || {};
        ['telegram', 'email', 'whatsapp', 'vk', 'instagram'].forEach(name => {
            if (form.elements[name]) form.elements[name].value = contacts[name] || '';
        });
        if (user.avatar && !user.avatar.startsWith('../')) {
            avatarImage.src = user.avatar;
            avatarValue = user.avatar;
        }
    } catch (error) {
        console.error('Ошибка заполнения настроек:', error);
    }

    avatarPicker.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (file) avatarImage.src = URL.createObjectURL(file);
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const nickname = nicknameInput.value.trim();
        const description = descriptionInput.value.trim();
        if (!nickname || !description) return showError('Заполните профиль', 'Укажите имя и описание профиля.');
        const contacts = Object.fromEntries(['telegram', 'email', 'whatsapp', 'vk', 'instagram'].map(name => [name, form.elements[name]?.value.trim() || null]));
        const contactError = validateContacts(contacts);
        if (contactError) return showError('Проверьте контакты', contactError);

        const payload = new FormData();
        payload.append('nickname', nickname);
        payload.append('description', description);
        payload.append('contacts', JSON.stringify(contacts));
        if (avatarInput.files[0]) payload.append('avatar', avatarInput.files[0]);
        else payload.append('avatar', avatarValue);

        try {
            const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
            const response = await fetch('/account/save-settings', {
                method: 'POST', headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: payload
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || 'Не удалось сохранить изменения.');
            await Swal.fire({ icon: 'success', title: 'Настройки сохранены', text: result.message || 'Профиль обновлён.' });
            window.location.reload();
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
            showError('Ошибка сохранения', error.message);
        }
    });
});
