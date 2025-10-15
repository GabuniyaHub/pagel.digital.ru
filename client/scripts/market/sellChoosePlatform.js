document.addEventListener("DOMContentLoaded", () => {
    const platformList = document.getElementById("platform-list");
    const searchInput = document.getElementById("platform-search-input");
    let platforms = []; // Массив для хранения платформ
    // Функция для загрузки платформ
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

            // добавим category_name и platform_id вручную
            formData.append('category_name', window.selectedProduct.name);
            formData.append('category_description', window.selectedProduct.description || '');
            formData.append('show_link', document.getElementById('show_link').checked);
            formData.append('theme', document.getElementById('theme').value);

            // Получить все платформы из БД и найти нужную по slug
            const responsePlatforms = await fetch('/market/search');
            const platforms = await responsePlatforms.json();
            const selectedPlatform2 = platforms.find(p => p.slug === window.selectedPlatformId);

            if (selectedPlatform2) {
                formData.append('platform_id', selectedPlatform2.id);
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

            for (let pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }

            try {
                const categories_id = window.selectedProduct.name;
                const response = await fetch('/market/create-listings', {

                    method: 'POST',
                    headers: {
                        // 'Content-Type': 'application/json',
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
                        html += `<br><a href="/market/listings/${result.existingId}" target="_blank">Перейти к объявлению</a>`;
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'Ошибка',
                        html: html,
                        confirmButtonText: 'Отмена'
                    });
                    return;
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'Готово!',
                    text: 'Объявление успешно создано.',
                    confirmButtonText: 'Ок'
                });

                form.reset();
                location.reload();
                // console.log(result);
            } catch (err) {
                console.error('Ошибка отправки:', err);
                Swal.fire({
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
                document.querySelector('.create-listing').style.display = 'none';
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
                    console.log(platforms); //  что реально приходит

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
                            if (product.image) {
                                const img = document.createElement("img");
                                img.src = product.image;
                                img.alt = product.name;
                                img.classList.add("product-icon");
                                productLi.appendChild(img);
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
                            }

                            function showFormByType(formType) {
                                const form1 = document.querySelector('.create-listing');
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
                                document.querySelector('.create-listing').style.display = 'block';
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