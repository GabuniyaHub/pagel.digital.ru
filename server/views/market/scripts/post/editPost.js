function preloadExistingScreenshots(screenshots) {
    window.existingScreenshots = screenshots || [];
    updatePreview();
}

async function resizeImage(file, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            let { width, height } = img;

            if (width <= maxWidth && height <= maxHeight) {
                resolve(file);
                return;
            }

            const widthRatio = maxWidth / width;
            const heightRatio = maxHeight / height;
            const ratio = Math.min(widthRatio, heightRatio, 1);

            const newWidth = Math.round(width * ratio);
            const newHeight = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            canvas.toBlob((blob) => {
                resolve(blob);
            }, file.type, 0.92); // качество 0.92 — оптимально для jpg/png
        };

        reader.readAsDataURL(file);
    });
}

async function populateForm1Fields(listingData) {
    const form = document.getElementById('listing-form');
    const modal = document.getElementById('formType1Modal');
    const closeButton = modal?.querySelector('.close-button');

    if (!form || !modal) return;

    const fieldMap = {
        'listing_id_hidden_field': listingData.id,
        'link': listingData.link,
        'show_link': listingData.show_link,
        'theme': listingData.theme,
        'price': listingData.price,
        'allow_comments': listingData.allow_comments,
        'description': listingData.description,
        'income': listingData.income,
        'expense': listingData.expense,
        'income_sources': listingData.income_sources,
        'expense_sources': listingData.expense_sources,
        'promotion': listingData.promotion,
        'support_needs': listingData.support_needs,
        // Контакты
        'contacts[telegram]': listingData.contacts?.telegram,
        'contacts[vk]': listingData.contacts?.vk,
        'contacts[instagram]': listingData.contacts?.instagram,
        'contacts[whatsapp]': listingData.contacts?.whatsapp,
        'contacts[email]': listingData.contacts?.email,
    };

    // Устанавливаем значения для обычных input/select/textarea
    Object.entries(fieldMap).forEach(([key, value]) => {
        const input = form.querySelector(`[name="${key}"], #${key}`);
        // console.log(`Подставляем поле ${key}:`, value);
        if (input) {
            if (input.type === 'checkbox') {
                input.checked = Boolean(value);
            } else {
                input.value = value != null ? value : '';
            }
        }
    });

    // Обработка поля screenshots
    if (typeof window.updatePreview === 'function') {
        window.existingScreenshots = listingData.screenshots || [];
        window.updatePreview();
    }

    // Обработка radio-кнопок content_type
    if (listingData.content_type) {
        const contentRadios = form.querySelectorAll('input[name="content_type"]');
        contentRadios.forEach(radio => {
            radio.checked = radio.value === listingData.content_type;
        });
    }

    // Обработка radio-кнопок monetization (булево в виде '1' / '0')
    if (listingData.monetization != null) {
        const monetizationValue = listingData.monetization ? '1' : '0';
        const monetizationRadios = form.querySelectorAll('input[name="monetization"]');
        monetizationRadios.forEach(radio => {
            radio.checked = radio.value === monetizationValue;
        });
    }

    // Ссылка: включение/отключение disabled по show_link
    const showLinkCheckbox = form.querySelector('#show_link');
    const linkInput = form.querySelector('#link');

    if (showLinkCheckbox) {
        showLinkCheckbox.checked = Boolean(listingData.show_link); 
    }

    if (linkInput) {
        linkInput.value = listingData.link || '';
        linkInput.readOnly = true;
    }

    // Отобразить модалку
    modal.style.display = 'flex';

    // Закрытие по кнопке, клику вне и Escape
    if (!closeButton.dataset.listenerAdded) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        closeButton.dataset.listenerAdded = 'true';
    }

    if (!modal.dataset.listenerAdded) {
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.style.display = 'none';
        });
        modal.dataset.listenerAdded = 'true';
    }

    if (!document.body.dataset.escapeListenerAdded) {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
        document.body.dataset.escapeListenerAdded = 'true';
    }

    form.onsubmit = null;

    form.onsubmit = async function (e) {
        e.preventDefault();

        const formData = new FormData(form);

        for (const [key, value] of Object.entries(listingData)) {
            if (!formData.has(key) && value !== undefined && value !== null) {
                formData.append(key, value);
            }
            // console.log(`Добавлено в FormData: ${key} = ${value}`);
        }

        //смотрим содержимое formData
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        formData.append('existingScreenshots', JSON.stringify(window.existingScreenshots || []));


        // console.log('Скриншоты для отправки:', window.filesArray);
        //     window.filesArray.forEach(file => {
        //         console.log('Имя файла:', file.name, 'Тип:', file.type, 'Размер:', file.size);
        //     });

        // Сжимаем и добавляем новые скриншоты
        if (window.filesArray && Array.isArray(window.filesArray)) {
            for (let i = 0; i < window.filesArray.length; i++) {
                const file = window.filesArray[i];
                // Только изображения (jpeg, png, webp)
                if (/^image\/(jpeg|png|webp)$/i.test(file.type)) {
                    const resizedBlob = await resizeImage(file, 1920, 1080);
                    const resizedFile = new File([resizedBlob], file.name, { type: file.type });
                    formData.append('screenshots', resizedFile);
                } else {
                    // Не изображение — добавляем как есть
                    formData.append('screenshots', file);
                }
            }
        }

        const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");

        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка авторизации',
                text: 'Не удалось найти JWT токен.'
            });
            return;
        }

        try {
            const listingId = document.getElementById('count-views')?.dataset.listing;
            const response = await fetch(`/market/listings/${listingId}/edit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Успешно сохранено'
                });
                window.location.reload();
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка при сохранении');
            }
        } catch (err) {
            console.error('Ошибка запроса:', err);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка при отправке',
                text: err.message || 'Неизвестная ошибка'
            });
        }
    };
}

async function populateForm2Fields(listingData) {
    const form = document.getElementById('simple-listing-form');
    const modal = document.getElementById('formType2Modal');
    const closeButton = modal?.querySelector('.close-button');

    const coverPreview = document.getElementById('cover-preview');
    const coverFilename = document.getElementById('cover-filename');
    const coverInput = document.getElementById('simple-cover');

    if (!form || !modal) return;

    // Заполняем поля
    form.querySelector('[name="title"]').value = listingData.name || '';
    form.querySelector('[name="description"]').value = listingData.description || '';
    form.querySelector('[name="price"]').value = listingData.price || '';

    // Контакты
    form.querySelector('[name="contacts[telegram]"]').value = listingData.contacts?.telegram || '';
    form.querySelector('[name="contacts[vk]"]').value = listingData.contacts?.vk || '';
    form.querySelector('[name="contacts[instagram]"]').value = listingData.contacts?.instagram || '';
    form.querySelector('[name="contacts[whatsapp]"]').value = listingData.contacts?.whatsapp || '';
    form.querySelector('[name="contacts[e-mail]"]').value = listingData.contacts?.email || '';

    // Комментарии
    form.querySelector('[name="allow_comments"]').checked = !!listingData.allow_comments;

    

    // При открытии формы (обложка)
    if (listingData.cover) {
        coverPreview.innerHTML = `<img src="/market/uploads/${listingData.cover}" alt="cover" style="max-width:100px;">`;
        coverFilename.textContent = listingData.cover;
    } else {
        coverPreview.innerHTML = '';
        coverFilename.textContent = 'Файл не выбран';
    }


    // При выборе новой обложки
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

    // Показываем модалку
    modal.style.display = 'flex';

    // Закрытие по кнопке, клику вне и Escape (аналогично первой форме)
    if (closeButton && !closeButton.dataset.listenerAdded) {
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        closeButton.dataset.listenerAdded = 'true';
    }
    if (!modal.dataset.listenerAdded) {
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.style.display = 'none';
        });
        modal.dataset.listenerAdded = 'true';
    }
    if (!document.body.dataset.escapeListenerAdded) {
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                modal.style.display = 'none';
            }
        });
        document.body.dataset.escapeListenerAdded = 'true';
    }

    // Обработка submit
    form.onsubmit = async function(e) {
        e.preventDefault();

        const formData = new FormData(form);

        formData.set('name', form.querySelector('[name="title"]').value.trim());
        formData.set('allow_comments', form.querySelector('[name="allow_comments"]').checked ? '1' : '0');

        for (const [key, value] of Object.entries(listingData)) {
            if (!formData.has(key) && value !== undefined && value !== null) {
                formData.append(key, value);
            }
            console.log(`Добавлено в FormData: ${key} = ${value}`);
        }

        const name = form.querySelector('[name="title"]').value.trim();
        const description = form.querySelector('[name="description"]').value.trim();
        const price = form.querySelector('[name="price"]').value.trim();

        // Проверки на клиенте (дублируют pattern из HTML)
        if (name.length < 5 || name.length > 100) {
            return Swal.fire('Ошибка', 'Название должно содержать от 5 до 100 символов.', 'error');
        }
        if (description.length < 10 || description.length > 1000) {
            return Swal.fire('Ошибка', 'Описание должно содержать от 10 до 1000 символов.', 'error');
        }
        if (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) < 0) {
            return Swal.fire('Ошибка', 'Цена должна быть положительным числом.', 'error');
        }
        // if (coverInput.files.length === 0) {
        //     return Swal.fire('Ошибка', 'Пожалуйста, загрузите обложку.', 'error');
        // }

        // Контакты как JSON
        const contactsObj = {
            telegram: form.querySelector('[name="contacts[telegram]"]').value.trim(),
            vk: form.querySelector('[name="contacts[vk]"]').value.trim(),
            instagram: form.querySelector('[name="contacts[instagram]"]').value.trim(),
            whatsapp: form.querySelector('[name="contacts[whatsapp]"]').value.trim(),
            email: form.querySelector('[name="contacts[e-mail]"]').value.trim()
        };

        // Проверка: хотя бы одно поле должно быть заполнено
        const hasAnyContact = Object.values(contactsObj).some(value => value);

        if (!hasAnyContact) {
            return Swal.fire({
                icon: 'error',
                title: 'Контактные данные обязательны',
                text: 'Пожалуйста, заполните хотя бы одно поле для связи.'
            });
        }

        // Валидация каждого поля, если оно заполнено
        if (contactsObj.telegram && !/^@?[a-zA-Z0-9_]{5,32}$/.test(contactsObj.telegram)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Telegram',
                text: 'Введите корректный Telegram username (от 5 до 32 символов).'
            });
        }

        if (contactsObj.vk && !/^https?:\/\/(www\.)?vk\.com\/[a-zA-Z0-9_.]+$/.test(contactsObj.vk)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверная ссылка VK',
                text: 'Укажите ссылку на профиль VK (например, https://vk.com/id12345).'
            });
        }

        if (contactsObj.instagram && !/^@?[a-zA-Z0-9_.]{1,30}$/.test(contactsObj.instagram)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Instagram',
                text: 'Введите корректный Instagram username (до 30 символов).'
            });
        }

        if (contactsObj.whatsapp && !/^\+?[0-9\s\-\(\)]{7,20}$/.test(contactsObj.whatsapp)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный номер WhatsApp',
                text: 'Введите корректный номер телефона.'
            });
        }

        if (contactsObj.email && !/^[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}$/.test(contactsObj.email)) {
            return Swal.fire({
                icon: 'error',
                title: 'Неверный Email',
                text: 'Введите корректный адрес электронной почты.'
            });
        }

        // Добавляем контакты в FormData
        formData.append('contacts', JSON.stringify(contactsObj));

        // Обложка (если выбрана новая)
        // const coverInput = form.querySelector('[name="cover"]');
        // if (coverInput && coverInput.files.length > 0) {
        //     formData.append('cover', coverInput.files[0]);
        // } else if (listingData.cover) {
        //     formData.append('cover', listingData.cover); 
        // }

        const coverInput = form.querySelector('[name="cover"]');
        if (coverInput && coverInput.files.length === 1) {
            formData.append('cover', coverInput.files[0]);
            console.log('Новая обложка добавлена:', coverInput.files[0].name);
        }

        // Добавь другие нужные поля, если требуется

        const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");
        if (!token) {
            await Swal.fire({
                icon: 'error',
                title: 'Ошибка авторизации',
                text: 'Не удалось найти JWT токен.'
            });
            return;
        }

        try {

            for (const [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log('Файл:', key, value.name);
                }
            }

            const listingId = form.dataset.listing;
            const response = await fetch(`/market/listings/${listingId}/edit`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Успешно сохранено'
                });
                window.location.reload();
            } else {
                const errorText = await response.text();
                throw new Error(errorText || 'Ошибка при сохранении');
            }
        } catch (err) {
            console.error('Ошибка запроса:', err);
            Swal.fire({
                icon: 'error',
                title: 'Ошибка при отправке',
                text: err.message || 'Неизвестная ошибка'
            });
        }
    };
}

async function validatePagePrerequisites() {
    const editButtonForm1 = document.getElementById('editListing') || null;
    const editButtonForm2 = document.getElementById('editListing2') || null;
    // const formType2 = editButtonForm2 ? editButtonForm2.dataset.formType : null;
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    let editButton = null;

    if (editButtonForm1) {
        editButton = editButtonForm1
    } 

    if (editButtonForm2) {
         editButton = editButtonForm2;
    }

    const formType = editButton ? editButton.dataset.formType : null;

 
    if (!formType) {
        console.error("Атрибут data-form-type на элементе 'editListing' не найден.");
        return false;
    }

    if (!token) {
        console.error("Токен не найден. Войдите в систему!");
        await Swal.fire({
            icon: 'warning',
            title: 'Необходима авторизация',
            text: 'Для выполнения этого действия вам необходимо войти в систему.',
            confirmButtonText: 'ОК'
        });
        window.location.href = 'http://localhost:3000/pages/user-auth/login.html';
        return false; 
    }

    return {editButton, formType, token }; 
}

document.addEventListener('DOMContentLoaded', async function() {
    const validationResult = await validatePagePrerequisites();

    if (!validationResult) {
        return;
    }

    const { editButton, formType, token } = validationResult; 

    
    editButton.addEventListener('click', async function() {
        
        const listingIDF1 = document.getElementById('post-section-1')?.dataset.listing;
        const listingIDF2 = document.getElementById('post-section-2')?.dataset.listing;

        let listingID = null;

        if ( listingIDF1 ) {
             listingID = listingIDF1;
        }

        if ( listingIDF2 ) {
             listingID = listingIDF2;
        }

        if (!listingID) {
            console.error("Не удалось найти ID объявления в атрибуте data-listing.");
        }

        try {
            const response = await fetch(`/market/listings/${listingID}/get`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            

            if (!response.ok) {
                const errorData = await response.json(); 
                console.error('Ошибка при получении данных:', response.status, errorData);
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка!',
                    text: `Не удалось получить данные объявления: ${errorData.message || response.statusText}`
                });
                return; 
            }

            const data = await response.json();
            console.log('Данные объявления получены успешно:', data);

            if (formType === '1') {
                const listingData = data.listing;
                await populateForm1Fields(listingData);
            } 
        
            if (formType !== '1') {
                const listingData = data.listing;
                await populateForm2Fields(listingData);
            }

        } catch (err) {
            console.error('Произошла ошибка при запросе:', err);
            Swal.fire({
                icon: 'error',
                title: 'Произошла ошибка!',
                text: `Пожалуйста, попробуйте еще раз. (${err.message})`
            });
        }
    });

    // editButtonForm2.addEventListener('click', async function() {
    //     const listingID = document.getElementById('count-views')?.dataset.listing;

    //     try {
    //         const response = await fetch(`/market/listings/${listingID}/get`, {
    //             method: 'GET',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${token}`
    //             }
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             console.error('Ошибка при получении данных:', response.status, errorData);
    //             Swal.fire({
    //                 icon: 'error',
    //                 title: 'Ошибка!',
    //                 text: `Не удалось получить данные объявления: ${errorData.message || response.statusText}`
    //             });
    //             return; 
    //         }

    //         const data = await response.json();
    //         console.log('Данные объявления получены успешно:', data);

    //         if (formType === '1' && formType2 === '1') {
    //             const listingData = data.listing;
    //             await populateForm1Fields(listingData);
    //         } 

    //         if (formType !== '1' && formType2 !== '1') {
    //             const listingData = data.listing;
    //             await populateForm2Fields(listingData);
    //         } 

    //     } catch (err) {
    //         console.error('Произошла ошибка при запросе:', err);
    //         Swal.fire({
    //             icon: 'error',
    //             title: 'Произошла ошибка!',
    //             text: `Пожалуйста, попробуйте еще раз. (${err.message})`
    //         });
    //     }
    // });
});