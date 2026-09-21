import { getData } from './getData.js?v=profile-3';
import { normalizeContacts, contactNames, defaultAvatar, renderProfileContacts } from '../profileShared.js?v=profile-3';

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.querySelector('#settings .settings-form');
    if (!form) return;
    const fileInput = document.getElementById('avatar-file');
    const preview = document.getElementById('avatar-image');
    const status = document.getElementById('profile-save-status');
    const submit = form.querySelector('[type=submit]');
    let loaded = false;
    let previewUrl;
    try {
        const { user } = await getData();
        if (!user) throw new Error('Профиль не найден');
        form.elements.nickname.value = user.nickname || '';
        form.elements.description.value = user.description || '';
        const contacts = normalizeContacts(user.contacts);
        contactNames.forEach(name => { form.elements[name].value = contacts[name]; });
        preview.src = user.avatar && !user.avatar.startsWith('../') ? user.avatar : defaultAvatar;
        loaded = true;
        submit.disabled = false;
    } catch {
        status.textContent = 'Не удалось загрузить профиль. Обновите страницу перед сохранением.';
    }
    preview.addEventListener('error', () => { if (!preview.src.endsWith(defaultAvatar)) preview.src = defaultAvatar; });
    document.getElementById('avatar-picker').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
            status.textContent = 'Выберите JPG, PNG или WebP размером до 5 МБ.';
            fileInput.value = '';
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = URL.createObjectURL(file);
        preview.src = previewUrl;
        status.textContent = 'Фото выбрано. Нажмите «Сохранить изменения».';
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!loaded || submit.disabled) return;
        const contacts = normalizeContacts(Object.fromEntries(contactNames.map(name => [name, form.elements[name].value])));
        contacts.telegram = contacts.telegram.replace(/^https?:\/\/(?:www\.)?t\.me\//i, '').replace(/^@/, '');
        if (!Object.values(contacts).some(Boolean)) { status.textContent = 'Укажите хотя бы один способ связи.'; return; }
        if (contacts.telegram && !/^[a-zA-Z0-9_]{5,32}$/.test(contacts.telegram)) { status.textContent = 'Проверьте имя пользователя Telegram.'; return; }
        if (contacts.whatsapp && !/^\+?[0-9\s\-()]{7,20}$/.test(contacts.whatsapp)) { status.textContent = 'Проверьте номер WhatsApp.'; return; }
        const payload = new FormData();
        payload.append('nickname', form.elements.nickname.value.trim());
        payload.append('description', form.elements.description.value.trim());
        payload.append('contacts', JSON.stringify(contacts));
        if (fileInput.files[0]) payload.append('avatar', fileInput.files[0]);
        submit.disabled = true;
        status.textContent = 'Сохраняем профиль…';
        try {
            const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
            const response = await fetch('/account/save-settings', {
                method: 'POST', credentials: 'include',
                headers: token ? { Authorization: 'Bearer ' + token } : {}, body: payload
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(result.error || result.message || 'Не удалось сохранить профиль.');
            const user = result.user;
            document.querySelectorAll('.profile-name').forEach(el => { el.textContent = user.nickname; });
            document.querySelectorAll('.profile-desc').forEach(el => { el.textContent = user.description || 'Описание пока не добавлено'; });
            document.querySelectorAll('.profile-img').forEach(el => { el.src = user.avatar || defaultAvatar; });
            preview.src = user.avatar || defaultAvatar;
            renderProfileContacts(user.contacts);
            fileInput.value = '';
            status.textContent = 'Изменения сохранены. Контакты доступны в публичном профиле.';
        } catch (error) { status.textContent = error.message; }
        finally { submit.disabled = false; }
    });
});
