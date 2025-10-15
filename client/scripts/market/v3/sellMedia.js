document.addEventListener('DOMContentLoaded', async () => {
    const platformList = document.getElementById("platform-list"); // Список платформ
    const searchInput = document.getElementById("platform-search-input"); // Поле ввода для поиска платформ
    let platforms = []; // Массив для хранения платформ

    // Функция для получения списка платформ
    async function loadPlatforms(query = "") {
        try {
            const response = await fetch(`/market/platforms`);
            if (!response.ok) {
                throw new Error(`Ошибка: ${response.status}`);
            }

            platforms = await response.json();
            renderPlatforms(platforms);
        } catch (error) {
            console.error("Ошибка загрузки платформ:", error);
        }
    }

    function validatePlatformLink(selectedPlatform2, linkValue) {

        console.log('Выбранная платформа:' + selectedPlatform2);
        console.log('Выбранная ссылка:' + linkValue);

        const platformLinkRules = {
            youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i,
            telegram: /^https?:\/\/(t\.me|telegram\.me)\//i,
            vkontakte: /^https?:\/\/(vk\.com|vkontakte\.ru)\//i,
            instagram: /^https?:\/\/(www\.)?instagram\.com\//i,
            tiktok: /^https?:\/\/(www\.)?tiktok\.com\//i,
            twitter: /^https?:\/\/(twitter\.com|x\.com)\//i,
            reddit: /^https?:\/\/(www\.)?reddit\.com\//i,
            linkedin: /^https?:\/\/(www\.)?linkedin\.com\//i,
            tumblr: /^https?:\/\/(www\.)?tumblr\.com\//i,
            flickr: /^https?:\/\/(www\.)?flickr\.com\//i,
            quora: /^https?:\/\/(www\.)?quora\.com\//i,
            pinterest: /^https?:\/\/(www\.)?pinterest\.com\//i,
            snapchat: /^https?:\/\/(www\.)?snapchat\.com\//i,
            whatsapp: /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\//i,
            discord: /^https?:\/\/(discord\.gg|discord\.com)\//i,
            skype: /^https?:\/\/(join\.skype\.com|skype\.com)\//i,
            twitch: /^https?:\/\/(www\.)?twitch\.tv\//i,
            facebook: /^https?:\/\/(www\.)?facebook\.com\//i,
            viber: /^https?:\/\/(invite\.viber\.com|viber\.com)\//i,
            medium: /^https?:\/\/(www\.)?medium\.com\//i,
            wechat: /^https?:\/\/(wechat\.com)\//i,
            periscope: /^https?:\/\/(www\.)?periscope\.tv\//i,
            clubhouse: /^https?:\/\/(www\.)?joinclubhouse\.com\//i,
            mix: /^https?:\/\/(www\.)?mix\.com\//i,
            gab: /^https?:\/\/(gab\.com)\//i,
            parler: /^https?:\/\/(parler\.com)\//i,
            mewe: /^https?:\/\/(mewe\.com)\//i,
            ello: /^https?:\/\/(ello\.co)\//i,
            mastodon: /^https?:\/\/(mastodon\.social)\//i,
            minds: /^https?:\/\/(www\.)?minds\.com\//i,
            rumble: /^https?:\/\/(rumble\.com)\//i,
            badoo: /^https?:\/\/(badoo\.com)\//i,
            foursquare: /^https?:\/\/(foursquare\.com)\//i,
            yelp: /^https?:\/\/(www\.)?yelp\.com\//i,
            meetup: /^https?:\/\/(www\.)?meetup\.com\//i,
            nextdoor: /^https?:\/\/(nextdoor\.com)\//i,
            signal: /^https?:\/\/(signal\.org)\//i,
            line: /^https?:\/\/(line\.me)\//i,
            kakaotalk: /^https?:\/\/(open\.kakao\.com)\//i,
            sinaweibo: /^https?:\/\/(weibo\.com)\//i,
            douyin: /^https?:\/\/(douyin\.com)\//i,
            bytedance: /^https?:\/\/(bytedance\.com)\//i,
            zhihu: /^https?:\/\/(zhihu\.com)\//i
            // Добавь остальные по необходимости
        };

        if (selectedPlatform2 && platformLinkRules[selectedPlatform2]) {
            return platformLinkRules[selectedPlatform2].test(linkValue);
        }

        return true; // Если платформа не указана, считаем ссылку валидной
    };

    function avatarPreviewHandler() {
        const avatarInput = document.getElementById('profile-avatar-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const avatarLabel = document.querySelector('.profile-avatar-label');

        avatarInput.addEventListener('change', function () {
            const file = this.files[0];
            if (file) {
                // Показ превью
                const reader = new FileReader();
                reader.onload = function (e) {
                    avatarPreview.src = e.target.result;
                    avatarPreview.style.display = 'block';
                }
                reader.readAsDataURL(file);

                // Изменение кнопки
                avatarLabel.innerHTML = `<i class="fas fa-check"></i> Файл выбран`;
                avatarLabel.style.background = "#28a745"; // зелёный
            } else {
                avatarPreview.style.display = 'none';
                avatarLabel.innerHTML = `<i class="fas fa-image"></i> Загрузить аватарку`;
                avatarLabel.style.background = "#4e8cff";
            }
        });
        // Инициализация превью, если файл уже выбран
        if (avatarInput.files.length > 0) {
            const file = avatarInput.files[0];
            const reader = new FileReader();
            reader.onload = function (e) {
                avatarPreview.src = e.target.result;
                avatarPreview.style.display = 'block';
                avatarLabel.innerHTML = `<i class="fas fa-check"></i> Файл выбран`;
                avatarLabel.style.background = "#28a745"; // зелёный
            }
            reader.readAsDataURL(file);
        } else {
            avatarPreview.style.display = 'none';
            avatarLabel.innerHTML = `<i class="fas fa-image"></i> Загрузить аватарку`;
            avatarLabel.style.background = "#4e8cff";
        }
    }

     avatarPreviewHandler();

    const linkInput = document.getElementById('link');
    // Добавляем обработчик события input для поля ввода ссылки
    linkInput.addEventListener('input', async () => {
        const form = document.getElementById('listing-form');

        const subscribers = form.querySelector('#profile-subscribers');
        const avatarInput = form.querySelector('#profile-avatar-input');
        const name = form.querySelector('#profile-name');
        const avatarPreview = form.querySelector('#avatar-preview');

        const editBlock = document.getElementById('profile-edit-block');
        const viewBlock = document.getElementById('profile-view-block');
        const displayAvatar = document.getElementById('display-avatar');
        const displayName = document.getElementById('display-name');
        const displaySubscribers = document.getElementById('display-subscribers');

        // Если поле пустое — показываем режим редактирования, очищаем view
        if (!linkInput.value.trim()) {
            subscribers.value = '';
            name.value = '';
            avatarInput.value = '';
            avatarPreview.src = '';
            avatarPreview.style.display = 'none';

            viewBlock.style.display = 'none';
            editBlock.style.display = 'flex';
            return;
        }

        try {
            const responsePlatforms = await fetch('/market/search');
            const platforms = await responsePlatforms.json();
            const selectedPlatform2 = platforms.find(p => p.slug === window.selectedPlatformId);

            if (
                selectedPlatform2.slug === 'youtube' ||
                selectedPlatform2.slug === 'vkontakte' ||
                selectedPlatform2.slug === 'telegram'
            ) {
                const platformData = selectedPlatform2.slug;
                const urlValue = encodeURIComponent(linkInput.value.trim());

                const response = await fetch(`/market/avatar?platform=${platformData}&url=${urlValue}`);
                if (!response.ok) throw new Error(`Ошибка запроса: ${response.status}`);

                const data = await response.json();
                // console.log('Ответ сервера:', data);

                // Заполняем режим просмотра
                displayName.textContent = data.title || '';
                displaySubscribers.textContent = data.subscribers ? `${data.subscribers} подписчиков` : '';
                if (data.avatar) displayAvatar.src = data.avatar;

                // Переключаем режим
                editBlock.style.display = 'none';
                viewBlock.style.display = 'flex';
            }
        } catch (error) {
            console.error('Ошибка:', error.message);
            inputs.forEach(el => el.style.display = '');
            viewBlock.style.display = 'none';
        }
    });

    // Функция для проверки отправки формы (1 и 2)
    function checkFormSubmission() {
        document.getElementById('listing-form').addEventListener('submit', async function (e) {
            e.preventDefault();

            const linkInput = document.getElementById('link');
            const linkValue = linkInput.value.trim();

            const token = sessionStorage.getItem('jwt') || localStorage.getItem('jwt');
            const user = JSON.parse(sessionStorage.getItem('user')) || JSON.parse(localStorage.getItem('user'));

            if (!token || !user) {
                e.preventDefault();
                Swal.fire({
                    icon: 'warning',
                    title: 'Необходима авторизация',
                    text: 'Пожалуйста, войдите в систему.',
                    confirmButtonText: 'Ок'
                });
                window.location.href = "pages/user-auth/login";
                return false;
            }

            const form = document.getElementById('listing-form');
            const formData = new FormData(form);

            const price = document.getElementById('price');
            const income = document.getElementById('income');
            const expense = document.getElementById('expense');

            function limitDigitsStrict(field, label = 'Значение') {
                const max = 99999999.999;
                let value = parseFloat(field.value);

                if (field.value.trim() === '') { // Проверяем, если поле пустое
                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        text: `${label} обязательно для заполнения.`
                    });
                    return false; // Возвращаем false, если поле пустое
                }

                if (isNaN(value)) { // Если после trim() все равно NaN (например, если ввели не числа)
                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        text: `${label} должно быть числом.`
                    });
                    return false;
                }

                if (value < 0) { // Добавим проверку на отрицательные значения, так как min="0" не блокирует ввод отрицательных
                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        text: `${label} не может быть отрицательным.`
                    });
                    return false;
                }

                if (value > max) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        text: `${label} не может превышать ${max.toLocaleString('ru-RU')}`
                    });
                    return false;
                }

                const match = field.value.match(/^(\d{0,9})(\.(\d{0,3})?)?/);
                if (match) {
                    field.value = match[0];
                }

                return true;
            }

            // Использование
            const isPriceOk = limitDigitsStrict(price);
            const isIncomeOk = limitDigitsStrict(income);
            const isExpenseOk = limitDigitsStrict(expense);


            if (!isPriceOk || !isIncomeOk || !isExpenseOk) {
                return; // уже показали ошибку внутри limitDigitsStrict
            }

            const flexSwitch = document.getElementById('flex_switch');
            if (flexSwitch && !flexSwitch.checked) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Подтвердите согласие',
                    text: 'Чтобы разместить объявление, необходимо согласиться с правилами размещения в сообществе.',
                    confirmButtonText: 'Понял, включаю галочку'
                });
                return;
            }

            // Сжимаем скриншоты
            function resizeImage(file, maxWidth = 1920, maxHeight = 1080) {
                return new Promise((resolve) => {
                    const img = new Image();
                    const reader = new FileReader();

                    reader.onload = (e) => {
                    img.src = e.target.result;
                    };

                    img.onload = () => {
                    let { width, height } = img;

                    // Вычисляем пропорциональные размеры, не превышающие maxWidth / maxHeight
                    const widthRatio = maxWidth / width;
                    const heightRatio = maxHeight / height;
                    const ratio = Math.min(widthRatio, heightRatio, 1); // Не увеличиваем изображение

                    const newWidth = Math.round(width * ratio);
                    const newHeight = Math.round(height * ratio);

                    const canvas = document.createElement('canvas');
                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    canvas.toBlob((blob) => {
                        resolve(blob);
                    }, file.type, 1.0); // тип и качество (0.0–1.0)
                    };

                    reader.readAsDataURL(file);
                });
            }


            // console.log("window.filesArray:", window.filesArray)
            if (window.filesArray) {
                for (let i = 0; i < window.filesArray.length; i++) {
                    const file = window.filesArray[i];
                    const resizedBlob = await resizeImage(file, 1920, 1080); // Размер по твоему выбору
                    const resizedFile = new File([resizedBlob], file.name, { type: file.type });
                    formData.append('screenshots', resizedFile);
                }
            }
            // добавим category_name и platform_id вручную
            formData.append('category_name', window.selectedProduct.name);
            formData.append('category_description', window.selectedProduct.description || '');
            // formData.append('platform_id', window.selectedPlatformId || "");
            // formData.append('show_link', document.getElementById('show_link').checked);
            formData.append('theme', document.getElementById('theme').value);
            formData.append('form_type', window.selectedProduct.formType); // или другое значение по умолчанию
            // formData.append('', document.getElementById(''))

           const profileNameInput = document.querySelector('#profile-name');
            const profileSubscribersInput = document.querySelector('#profile-subscribers');
            const profileAvatarInput = document.querySelector('#profile-avatar-input');

            const displayName = document.querySelector('#display-name');
            const displaySubscribers = document.querySelector('#display-subscribers');
            const displayAvatar = document.querySelector('#display-avatar');

            if (!profileNameInput && !displayName) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Не найдено поле для имени профиля. Пожалуйста, обновите страницу.',
                    confirmButtonText: 'ОК'
                });
                return;
            }

            if (!profileSubscribersInput && !displaySubscribers) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Не найдено поле для количества подписчиков. Пожалуйста, обновите страницу.',
                    confirmButtonText: 'ОК'
                });
                return;
            }

            if (!profileAvatarInput && !displayAvatar) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Не найдено поле для аватарки профиля. Пожалуйста, обновите страницу.',
                    confirmButtonText: 'ОК'
                });
                return;
            }


            const inputsToCheck = [
            ...form.querySelectorAll('input[name="name"], input[name="subscribers"], input[name="avatar"]')
            ];

            for (const input of inputsToCheck) {
            const style = window.getComputedStyle(input);
            const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && input.offsetParent !== null;

            if (!isVisible) {
                // Если поле скрыто — пропускаем
                continue;
            }

            if (input.type === 'file') {
                if (!input.files || input.files.length === 0) {
                e.preventDefault();
                input.focus();
                alert('Пожалуйста, загрузите аватарку');
                return;
                }
            } else {
                if (!input.value || input.value.trim() === '') {
                e.preventDefault();
                input.focus();
                alert(`Поле "${input.name}" обязательно для заполнения`);
                return;
                }
                if (input.name === 'name' && input.value.length < 3) {
                e.preventDefault();
                input.focus();
                alert('Название должно содержать минимум 3 символа');
                return;
                }
            }
            }




            // Для name — берем из отображения, если есть, иначе из input
            const nameToSend = displayName && displayName.textContent.trim() 
                ? displayName.textContent.trim() 
                : profileNameInput.value.trim();
            formData.append('name', nameToSend);

            // Для subscribers — аналогично
            const subscribersToSend = displaySubscribers && displaySubscribers.textContent.trim()
                ? displaySubscribers.textContent.trim()
                : profileSubscribersInput.value;
            formData.append('subscribers', subscribersToSend);

            // Для avatar — файл, если выбран в input, иначе можно взять url из displayAvatar.src (если нужно)
            if (profileAvatarInput.files.length > 0) {
                formData.append('avatar', profileAvatarInput.files[0]);
            } 

            // Собираем контакты    
            const contacts = {
                telegram: form.querySelector('[name="contacts[telegram]"]').value.trim() || null,
                vk: form.querySelector('[name="contacts[vk]"]').value.trim() || null,
                instagram: form.querySelector('[name="contacts[instagram]"]').value.trim() || null,
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

            // console.log('Raw contacts:', contacts);
            // console.log('Type of contacts:', typeof contacts);

            // Добавляем в formData
            formData.append('contacts', JSON.stringify(contacts));

            // Получить все платформы из БД и найти нужную по slug
            const responsePlatforms = await fetch('/market/search');
            const platforms = await responsePlatforms.json();
            const selectedPlatform2 = platforms.find(p => p.slug === window.selectedPlatformId);

            if (selectedPlatform2) {
                formData.append('platform_id', selectedPlatform2.id); // это число!
            } else {
                alert('Платформа не найдена!');
                return;
            }



            // console.log('Выбранная платформа:', selectedPlatform2);

            // Проверка патерна
            if (!validatePlatformLink(selectedPlatform2.slug, linkValue)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Пожалуйста, введите корректную ссылку на выбранную платформу.',
                    confirmButtonText: 'ОК'
                });
                linkInput.focus();
                return false;
            }

            // for (let pair of formData.entries()) {
            //     console.log(pair[0]+ ': ' + pair[1]);
            // }

            // Проверка владения сообществом 
            const ownershipCodeBlock = document.getElementById('ownership-code');
            const ownershipCode = ownershipCodeBlock ? ownershipCodeBlock.textContent.trim() : '';

            if (!ownershipCode) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Код подтверждения не найден. Пожалуйста, обновите страницу.',
                    confirmButtonText: 'ОК'
                });
                return;
            }

            // Отправляем код и ссылку на API для проверки

            const platformNameForCode = selectedPlatform2.slug

            // console.log(linkInput, linkValue, platformNameForCode);

            // Проверка владения
            try {
                const verifyRes = await fetch('/market/verify-ownership', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        link: linkValue,
                        code: ownershipCode,
                        platform: platformNameForCode
                    })
                });
                const verifyData = await verifyRes.json();

                if (!verifyRes.ok || !verifyData.success) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Владение не подтверждено',
                        text: verifyData.message || 'Код не найден в описании сообщества. Проверьте размещение кода и попробуйте снова.',
                        confirmButtonText: 'ОК'
                    });
                    return;
                }

                // Показываем окно успеха и ждем закрытия (или таймера)
                await Swal.fire({
                    icon: verifyData.message ? 'info' : 'success',
                    title: verifyData.message ? 'Внимание' : 'Готово',
                    text: typeof verifyData.message === 'string'
                        ? verifyData.message
                        : 'Вы подтвердили владение сообществом.',
                    confirmButtonText: 'ОК',
                    timer: 7000,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

            } catch (err) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Ошибка проверки владения. Попробуйте позже.',
                    confirmButtonText: 'ОК'
                });
                return;
            }

            // Только после успешной проверки — создаем объявление!
            try {
                const categories_id = window.selectedProduct.name;
                console.log(formData);


                const response = await fetch('/market/create-listings', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-User-ID': user.id,
                        'X-User-Email': user.email,
                        'X-Categories-ID': categories_id
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.status === 409) {
                    let html = 'Объявление с такой ссылкой уже существует.';
                    if (result.existingId) {
                        html += `<br><a href="/market/${platformNameForCode}/${categories_id}/items/${result.existingId}" target="_blank">Перейти к объявлению</a>`;
                    }
                    await Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        html: html,
                        confirmButtonText: 'Отмена'
                    });
                    return;
                }

                if (response.status === 201) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Готово!',
                        text: 'Объявление успешно создано. Вы будете перенаправлены на страницу профиля...',
                        html: `<a href="/market/${platformNameForCode}/${categories_id}/items/${result.listing.id}" target="_blank">Перейти к объявлению</a>`,
                        confirmButtonText: 'Ок',
                        timer: 15000,
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                    form.reset();
                    location.reload();
                }

                console.log(result);
            } catch (err) {
                console.error('Ошибка отправки:', err);
                await Swal.fire({
                    icon: 'error',
                    title: 'Ошибка',
                    text: 'Ошибка отправки формы. Пожалуйста, попробуйте позже.',
                    confirmButtonText: 'Понял'
                });
            }
        });
    };

    // Вызов функции проверки отправки формы
    checkFormSubmission();

    // Функция для отображения платформ
    function renderPlatforms(platforms) {
        platformList.innerHTML = ""; // Очищаем список

        if (platforms.length === 0) {
            platformList.innerHTML = "<li>Ничего не найдено</li>";
            return;
        }

        platforms.forEach((platform) => {
            const li = document.createElement("li");
            li.classList.add("platform-item");

            // Добавляем иконку платформы
            const img = document.createElement("img");
            img.src = platform.icon;
            img.alt = `${platform.name} icon`;
            img.classList.add("platform-icon");

            // Добавляем название платформы
            const span = document.createElement("span");
            span.textContent = platform.name;

            li.appendChild(img);
            li.appendChild(span);

            // Добавляем обработчик клика
            li.addEventListener("click", async () => {
                // Скрываем секции создания объявления
                document.querySelector('.form').style.display = 'none';
                document.querySelector('.create-listing-simple').style.display = 'none';

                // Показываем секцию выбора типа объявления
                const chooseProductSection = document.querySelector(".choose-product");
                chooseProductSection.style.display = "block";

                // Здесь можно динамически отрисовать продукты выбранной платформы
                const productList = document.getElementById("product-list");
                productList.innerHTML = ""; // Очищаем список

                try {
                    const response = await fetch(`/market/platforms/${platform.id}`);
                    if (!response.ok) {
                        throw new Error(`Ошибка: ${response.status}`);
                    }
                    // console.log(platforms); //  что реально приходит

                    const products = await response.json();

                    if (products.length === 0) {
                        productList.innerHTML = "<li>Нет доступных типов объявлений для этой платформы.</li>";
                        return;
                    }

                    if (!Array.isArray(products)) {
                        throw new Error("Неверный формат данных");
                    }

                    if (platform.products && platform.products.length > 0) {
                        platform.products.forEach(product => {
                            const productLi = document.createElement("li");
                            productLi.classList.add("product-item");

                            // Иконка продукта (если есть)
                            if (platform.icon) {
                                const img = document.createElement("img");
                                img.src = platform.icon;
                                img.alt = platform.name;
                                img.classList.add("product-icon");
                                productLi.appendChild(img);
                                // console.log('Картинка продукта:', platform.icon);
                            }

                            // Название продукта
                            const span = document.createElement("span");
                            span.textContent = product.name;
                            productLi.appendChild(span);

                            // Описание (если нужно)
                            if (product.description) {
                                const desc = document.createElement("div");
                                desc.classList.add("product-desc");
                                desc.textContent = product.description;
                                productLi.appendChild(desc);
                                // console.log('Описание продукта:', product.description);
                            }

                            function showFormByType(formType) {
                                const form1 = document.querySelector('.form');
                                const form2 = document.querySelector('.create-listing-simple');
                                if (formType === 1) {
                                    form1.style.display = 'block';
                                    form2.style.display = 'none';
                                    form1.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                                } else if (formType === 2) {
                                    form1.style.display = 'none';
                                    form2.style.display = 'block';
                                    form2.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
                                }
                            }

                            // Добавляем обработчик выбора продукта
                            productLi.addEventListener("click", () => {
                                // Снимаем выделение со всех продуктов
                                document.querySelectorAll('.product-item.selected').forEach(el => el.classList.remove('selected'));
                                // Выделяем выбранный продукт
                                productLi.classList.add('selected');

                                // Показываем секции создания объявления
                                document.querySelector('.form').style.display = 'block';
                                document.querySelector('.create-listing-simple').style.display = 'block';

                                // Сохраняем выбранный продукт в скрытое поле формы (например, с id="selected-product")
                                let hiddenInput = document.getElementById("selected-product");
                                if (!hiddenInput) {
                                    hiddenInput = document.createElement("input");
                                    hiddenInput.type = "hidden";
                                    hiddenInput.id = "selected-product";
                                    hiddenInput.name = "selected_product";
                                    document.getElementById("listing-form").appendChild(hiddenInput);
                                }
                                hiddenInput.value = product.name; // или product.id, если нужен id

                                // Можно также сохранить в JS-переменную, если нужно
                                window.selectedProduct = product;
                                window.selectedPlatformId = platform.id; // Сохраняем id платформы

                                // Добавляем/обновляем скрытое поле для categories_id
                                let categoryInput = document.getElementById("category_id");
                                if (!categoryInput) {
                                    categoryInput = document.createElement("input");
                                    categoryInput.type = "hidden";
                                    categoryInput.id = "category_id";
                                    categoryInput.name = "category_id";
                                    document.getElementById("listing-form").appendChild(categoryInput);
                                }
                                // Передаем значение из window.selectedProduct.categoryId (или другое нужное поле)
                                categoryInput.value = product.categoryId || "";

                                // Показываем ссылку на платформу
                                const platformLink = document.getElementById("platform-link");

                                showFormByType(product.formType); // Показываем форму в зависимости от типа продукта
                                // Пример: если product.formType === 1, показываем одну форму, если 2 - другую
                            });

                            //Сброс выбранного продукта при смене платформы
                            window.selectedProduct = null;
                            let hiddenInput = document.getElementById("selected-product");
                            if (hiddenInput) {
                                hiddenInput.value = ""; // Сбрасываем значение
                            }

                            productList.appendChild(productLi);
                        });
                    } else {
                        productList.innerHTML = "<li>Нет доступных типов объявлений для этой платформы.</li>";
                    }
                } catch (error) {
                    productList.innerHTML = "<li>Ошибка загрузки продуктов платформы.</li>";
                    console.error("Ошибка загрузки продуктов платформы:", error);
                }

                // Автоскрол к к секции выбора типа объявления
                chooseProductSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                });

            });

            platformList.appendChild(li);
        });
    }

    // Обработчик ввода в поле поиска
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = platforms.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.id.toLowerCase().includes(query)
        );
        renderPlatforms(filtered);
    });

    // Загрузка платформ при загрузке страницы
    loadPlatforms();


});