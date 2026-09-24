document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('simple-listing-form');
    const coverInput = document.getElementById('simple-cover');
    const coverFilename = document.getElementById('cover-filename');
    const coverPreview = document.getElementById('cover-preview');

    const token = sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
    const { user } = await window.PlglAuth.session;
    // console.log(user, token)
    if (!token || !user) {
        window.PlglAuth.login();
        return;
    }
    // console.log(user.id)
    // Показываем превью и имя файла при выборе
    if (coverInput) {
        coverInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                coverFilename.textContent = file.name;
                const reader = new FileReader();
                reader.onload = function (e) {
                    coverPreview.innerHTML = `<img src="${e.target.result}" alt="Обложка">`;
                };
                reader.readAsDataURL(file);
            } else {
                coverFilename.textContent = 'Файл не выбран';
                coverPreview.innerHTML = '';
            }
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Получаем значения полей
        const name = form.title.value.trim();
        const description = form.description.value.trim();
        const price = form.price.value.trim();
        const platform_id = window.selectedPlatformId; // строка, например 'linkedin'
        if (!window.selectedProduct || !await window.PlglAuth.require()) return;
        const category_name = window.selectedProduct.name; // например 'LinkedIn Connections Boost'
        const category_description = window.selectedProduct.description || '';
        const allow_comments = form.allow_comments.checked;

        console.log(name, description, price, platform_id, category_name, category_description);

        // Проверки на клиенте (дублируют pattern из HTML)
        if (name.length < 5 || name.length > 100) {
            return Swal.fire('Ошибка', 'Название должно содержать от 5 до 100 символов.', 'error');
        }
        if (description.length < 10 || description.length > 1000) {
            return Swal.fire('Ошибка', 'Описание должно содержать от 10 до 1000 символов.', 'error');
        }
        if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) <= 0) {
            return Swal.fire('Ошибка', 'Цена должна быть положительным числом.', 'error');
        }
        if (coverInput.files.length === 0) {
            return Swal.fire('Ошибка', 'Пожалуйста, загрузите обложку.', 'error');
        }

        // Формируем FormData для отправки файла и полей
        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('token', token);
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('platform_id', platform_id);
        formData.append('category_name', category_name);
        formData.append('category_description', category_description);
        formData.append('form_type', window.selectedProduct.formType);
        formData.append('allow_comments', allow_comments);
        formData.append('cover', coverInput.files[0]);

        // Собираем контакты    
        const contacts = {
            telegram: form.querySelector('[name="contacts[telegram]"]').value.trim() || null,
            vk: form.querySelector('[name="contacts[vk]"]')?.value.trim() || null,
            instagram: form.querySelector('[name="contacts[instagram]"]')?.value.trim() || null,
            whatsapp: form.querySelector('[name="contacts[whatsapp]"]').value.trim() || null,
            email: form.querySelector('[name="contacts[e-mail]"]').value.trim() || null
        };

        // Проверка: хотя бы одно поле должно быть заполнено
        const hasAnyContact = Object.values(contacts).some(value => value !== null);

        if (!hasAnyContact) {
            return Swal.fire({
                icon: 'error',
                title: 'Контактные данные обязательны',
                text: 'Пожалуйста, заполните хотя бы одно поле для связи.'
            });
        }

        // Валидация каждого поля, если оно заполнено
        if (contacts.telegram && !/^@?[a-zA-Z0-9_]{5,32}$/.test(contacts.telegram)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Telegram',
                text: 'Введите корректный Telegram username (от 5 до 32 символов).'
            });
        }

        if (contacts.vk && !/^https?:\/\/(www\.)?vk\.com\/[a-zA-Z0-9_.]+$/.test(contacts.vk)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверная ссылка VK',
                text: 'Укажите ссылку на профиль VK (например, https://vk.com/id12345).'
            });
        }

        if (contacts.instagram && !/^@?[a-zA-Z0-9_.]{1,30}$/.test(contacts.instagram)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Instagram',
                text: 'Введите корректный Instagram username (до 30 символов).'
            });
        }

        if (contacts.whatsapp && !/^\+?[0-9\s\-\(\)]{7,20}$/.test(contacts.whatsapp)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный номер WhatsApp',
                text: 'Введите корректный номер телефона.'
            });
        }

        if (contacts.email && !/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/.test(contacts.email)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Email',
                text: 'Введите корректный адрес электронной почты.'
            });
        }

        // Добавляем в formData
        formData.append('contacts', JSON.stringify(contacts));



        // Отправляем данные на сервер
        form.dispatchEvent(new CustomEvent('plgl:busy', { detail: true }));
        try {
            const res = await fetch('/market/simple-listing', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });
            const result = await res.json();

            if (!res.ok) {
                return Swal.fire('Ошибка', result.message || 'Ошибка сервера', 'error');
            }

            if (res.status === 201) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Готово!',
                        text: 'Объявление успешно создано. Вы будете перенаправлены на страницу профиля...',
                        html: `<a href="/market/${platform_id}/${category_name}/items/${result.id}" target="_blank">Перейти к объявлению</a>`,
                        confirmButtonText: 'Ок',
                        timer: 15000,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                    form.reset();
                    location.reload();
                }

            // await Swal.fire('Готово!', 'Объявление успешно создано!', 'success');
            // form.reset();
            coverFilename.textContent = 'Файл не выбран';
            coverPreview.innerHTML = '';
            // location.reload();
        } catch (err) {
            Swal.fire('Ошибка', 'Ошибка сети. Попробуйте позже.', 'error');
        } finally {
            form.dispatchEvent(new CustomEvent('plgl:busy', { detail: false }));
        }
    });
});
