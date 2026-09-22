document.addEventListener('DOMContentLoaded', async () => {
    const platformSelect = document.getElementById('listing-platform');
    const categorySelect = document.getElementById('listing-category');
    const status = document.getElementById('selection-status');
    const retry = document.getElementById('reload-categories');
    const preview = document.getElementById('listing-preview');
    const subscriberPreview = document.createElement('p');
    subscriberPreview.id = 'live-subscribers';
    subscriberPreview.hidden = true;
    document.getElementById('live-price').before(subscriberPreview);
    if (matchMedia('(max-width:800px)').matches) preview.open = false;
    let platforms = [], type = new URLSearchParams(location.search).get('type') === 'channel' ? 1 : 2, coverUrl = null;
    const channel = document.querySelector('.form');
    const service = document.querySelector('.create-listing-simple');
    const forms = [...document.querySelectorAll('main form')];
    const option = (text, value) => new Option(text, value);
    function updatePreview() {
        const simple = type === 2;
        const form = document.getElementById(simple ? 'simple-listing-form' : 'listing-form');
        const title = (!simple && window.plglParsedChannel?.title) || document.getElementById(simple ? 'simple-title' : 'profile-name').value;
        document.getElementById('live-title').textContent = title || 'Здесь появится название';
        document.getElementById('live-description').textContent = form.elements.description.value || 'Добавьте описание: что вы предлагаете и чем это полезно покупателю.';
        const price = form.elements.price.value;
        document.getElementById('live-price').textContent = price !== '' ? new Intl.NumberFormat('ru-RU', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(price)) : 'Цена не указана';
        document.getElementById('live-category').textContent = window.selectedProduct ? platformSelect.selectedOptions[0].textContent + ' / ' + categorySelect.selectedOptions[0].textContent : 'ВАШЕ ПРЕДЛОЖЕНИЕ';
        const file = document.getElementById(simple ? 'simple-cover' : 'profile-avatar-input').files[0];
        const image = document.getElementById('live-cover');
        if (coverUrl) URL.revokeObjectURL(coverUrl);
        coverUrl = file ? URL.createObjectURL(file) : null;
        const source = coverUrl || (!simple && window.plglParsedChannel?.avatar);
        image.hidden = !source;
        document.getElementById('live-placeholder').hidden = !!source;
        if (source) image.src = source; else image.removeAttribute('src');
        image.classList.toggle('channel-cover', !simple);
        const subscribers = document.getElementById('live-subscribers');
        subscribers.hidden = simple;
        subscribers.textContent = !simple ? ((window.plglParsedChannel?.subscribers ?? document.getElementById('profile-subscribers').value) || '0') + ' подписчиков' : '';
        updateProgress();
    }
    function selectCategory() {
        const platform = platforms.find(p => p.id === platformSelect.value);
        const product = platform?.products?.find(p => p.id === categorySelect.value && Number(p.formType) === type);
        window.selectedPlatformId = platform?.id;
        window.selectedProduct = product || null;
        channel.style.display = product && type === 1 ? 'block' : 'none';
        service.style.display = product && type === 2 ? 'block' : 'none';
        status.textContent = product ? 'Категория выбрана. Заполните детали и проверьте карточку перед размещением.' : 'Выберите доступную категорию.';
        updatePreview();
        if (product) openStep('description', false);
    }
    function selectPlatform() {
        const platform = platforms.find(p => p.id === platformSelect.value);
        const products = (platform?.products || []).filter(p => Number(p.formType) === type);
        categorySelect.replaceChildren(option('Выберите категорию', ''));
        products.forEach(p => categorySelect.add(option(p.description || p.name, p.id)));
        categorySelect.disabled = !products.length;
        resetParsedChannel();
        selectCategory();
        if (!products.length) status.textContent = 'Для этого типа предложения на выбранной платформе пока нет категорий. Выберите другую платформу или тип.';
        // Never retain fetched identity belonging to the previous platform.
        document.getElementById('display-name').textContent = '';
        document.getElementById('display-subscribers').textContent = '';
        document.getElementById('profile-edit-block').style.display = 'block';
        document.getElementById('profile-view-block').style.display = 'none';
    }
    document.querySelectorAll('[data-offer-type]').forEach(button => {
        button.addEventListener('click', () => {
            if (type === Number(button.dataset.offerType)) return;
            type = Number(button.dataset.offerType);
            document.querySelectorAll('[data-offer-type]').forEach(item => {
                const active = item === button;
                item.classList.toggle('selected', active);
                item.setAttribute('aria-pressed', String(active));
            });
            selectPlatform();
        });
    });
    platformSelect.addEventListener('change', selectPlatform);
    categorySelect.addEventListener('change', selectCategory);
    async function load() {
        retry.hidden = true;
        status.textContent = 'Загружаем доступные категории каталога.';
        try {
            const response = await fetch('/market/platforms');
            if (!response.ok) throw new Error('Не удалось загрузить категории.');
            platforms = await response.json();
            if (!Array.isArray(platforms) || !platforms.length) throw new Error('Платформы пока не добавлены.');
            platformSelect.replaceChildren(...platforms.map(p => option(p.name, p.id)));
            const requested = new URLSearchParams(location.search).get('platform') || 'youtube';
            platformSelect.value = platforms.some(p => p.id === requested) ? requested : platforms[0].id;
            platformSelect.disabled = false;
            selectPlatform();
            if (type === 1 && categorySelect.options.length === 2) {
                categorySelect.selectedIndex = 1;
                selectCategory();
            }
        } catch (error) {
            status.textContent = error.message + ' Попробуйте ещё раз.';
            retry.hidden = false;
        }
    }
    retry.addEventListener('click', load);
    // Visible labels remain above the values, even after placeholder text disappears.
    document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main textarea, main select').forEach((field, index) => {
        if (!field.id) field.id = 'sell-field-' + index;
        if (field.closest('label') || document.querySelector('label[for="' + field.id + '"]')) return;
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.textContent = field.placeholder?.split(', например:')[0] || ({avatar:'Изображение канала',subscribers:'Количество подписчиков',income:'Доход, $ в месяц',expense:'Расход, $ в месяц',groupTheme:'Тематика канала'})[field.name] || 'Значение';
        field.before(label);
    });
    forms.forEach(form => {
        form.addEventListener('input', updatePreview);
        form.addEventListener('change', updatePreview);
        // Capture duplicate submits without replacing the existing validation and API handlers.
        let busy = false;
        form.addEventListener('submit', event => {
            if (busy) { event.preventDefault(); event.stopImmediatePropagation(); return; }
        }, true);
        const button = form.querySelector('button[type=submit]');
        const original = button.textContent;
        form.addEventListener('plgl:busy', event => {
            busy = event.detail;
            button.disabled = busy;
            button.textContent = busy ? 'Размещаем…' : original;
        });
    });

    const stepLabels = { category: 'Категория', description: 'Описание и изображения', terms: 'Цена и условия', contacts: 'Контакты и размещение' };
    function makeSection(step, index) {
        const details = document.createElement('details');
        details.className = 'composer-section';
        details.dataset.section = step;
        const summary = document.createElement('summary');
        const title = document.createElement('span');
        title.textContent = String(index).padStart(2, '0') + '  ' + stepLabels[step];
        summary.append(title);
        const note = document.createElement('small');
        summary.append(note);
        const body = document.createElement('div');
        body.className = 'composer-body';
        details.append(summary, body);
        details.addEventListener('toggle', () => {
            if (!details.open || details.closest('form') && details.closest('form').offsetParent === null) return;
            document.querySelectorAll('.composer-section').forEach(other => { if (other !== details) other.open = false; });
            setActiveStep(step);
        });
        return { details, body };
    }
    function setActiveStep(step) {
        document.querySelectorAll('[data-step]').forEach(button => {
            if (button.dataset.step === step) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
    }
    function activeForm() { return document.getElementById(type === 2 ? 'simple-listing-form' : 'listing-form'); }
    function openStep(step, scroll = true) {
        if (step !== 'category' && !window.selectedProduct) {
            status.textContent = 'Сначала выберите категорию объявления.';
            step = 'category';
        }
        const section = step === 'category' ? document.querySelector('[data-section="category"]') : activeForm().querySelector('[data-section="' + step + '"]');
        if (!section) return;
        document.querySelectorAll('.composer-section').forEach(item => { item.open = item === section; });
        setActiveStep(step);
        if (scroll) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const categoryCard = document.querySelector('.selection-card');
    const categorySection = makeSection('category', 1);
    categoryCard.before(categorySection.details);
    categorySection.body.append(categoryCard);
    categorySection.details.open = true;
    forms.forEach(form => {
        const parts = {description:makeSection('description',2),terms:makeSection('terms',3),contacts:makeSection('contacts',4)};
        if (form.id === 'simple-listing-form') {
            let destination = parts.description.body;
            [...form.childNodes].forEach(node => {
                if (node.nodeType === 1 && node.matches('label[for="simple-price"]')) destination = parts.terms.body;
                if (node.nodeType === 1 && node.matches('label[for="simple-cover"]')) destination = parts.description.body;
                if (node.nodeType === 1 && node.matches('.contacts-section')) destination = parts.contacts.body;
                destination.append(node);
            });
        } else {
            parts.description.body.append(form.querySelector('.header-form-listing'), form.querySelector('.body-form-listing'));
            parts.contacts.body.append(form.querySelector('.footer-form-listing'));
            // Reattach fields before resolving them by document ID.
            for (const part of Object.values(parts)) form.append(part.details);
            const priceRow = document.getElementById('price').closest('.form-row');
            parts.terms.body.append(priceRow);
            for (const selector of ['.income-expense-row','.monetization-block']) parts.terms.body.append(form.querySelector(selector) || parts.description.body.querySelector(selector));
            for (const id of ['income_sources','expense_sources','promotion','support_needs']) {
                const field = document.getElementById(id);
                const label = parts.description.body.querySelector('label[for="' + id + '"]');
                if (label) parts.terms.body.append(label);
                parts.terms.body.append(field);
            }
        }
        for (const part of Object.values(parts)) form.append(part.details);
        for (const step of ['description','terms']) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'composer-next';
            button.textContent = step === 'description' ? 'Далее: цена и условия →' : 'Далее: контакты →';
            button.addEventListener('click', () => {
                const fields = [...parts[step].body.querySelectorAll('input,select,textarea')];
                const invalid = fields.find(field => !field.checkValidity());
                if (invalid) { invalid.reportValidity(); return; }
                openStep(step === 'description' ? 'terms' : 'contacts');
            });
            parts[step].body.append(button);
        }
        form.addEventListener('invalid', event => {
            const details = event.target.closest('.composer-section');
            if (details) openStep(details.dataset.section, false);
        }, true);
    });
    document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => openStep(button.dataset.step)));
    document.querySelectorAll('[data-offer-type]').forEach(button => {
        button.classList.toggle('selected', Number(button.dataset.offerType) === type);
        button.setAttribute('aria-pressed', String(Number(button.dataset.offerType) === type));
    });
    function updateProgress() {
        if (!document.querySelector('[data-section="category"]')) return;
        const form = activeForm();
        const valid = selector => [...form.querySelectorAll(selector)].every(field => field.value.trim() && field.checkValidity());
        const complete = {
            category: !!window.selectedProduct,
            description: type === 2 ? valid('#simple-title,#simple-description') && !!document.getElementById('simple-cover').files.length :
                !!document.getElementById('link').value && valid('#description,#theme') && !!(window.plglParsedChannel || document.getElementById('profile-avatar-input').files.length),
            terms: valid(type === 2 ? '#simple-price' : '#price,#income,#expense,#income_sources,#expense_sources,#promotion,#support_needs'),
            contacts: [...form.querySelectorAll('[name^="contacts["]')].some(field => field.value.trim()) && (type === 2 || document.getElementById('flex_switch').checked)
        };
        const count = Object.values(complete).filter(Boolean).length;
        document.getElementById('composer-progress').textContent = 'Заполнено ' + count + ' из 4 разделов';
        document.querySelectorAll('[data-step]').forEach(button => button.classList.toggle('complete', complete[button.dataset.step]));
        document.querySelector('[data-section="category"] summary small').textContent = window.selectedProduct?.description || 'Выберите предложение';
        for (const step of ['description','terms','contacts']) {
            const note = form.querySelector('[data-section="' + step + '"] summary small');
            if (note) note.textContent = complete[step] ? 'Заполнено ✓' : 'Заполните раздел';
        }
    }
    // Parser results belong to a particular URL and platform; discard stale responses.
    let parserTimer, parserRequest;
    const link = document.getElementById('link');
    const parserStatus = document.createElement('p');
    parserStatus.className = 'parser-status';
    parserStatus.setAttribute('role', 'status');
    link.parentElement.after(parserStatus);
    function resetParsedChannel() {
        clearTimeout(parserTimer);
        parserRequest?.abort();
        window.plglParsedChannel = null;
        document.getElementById('display-name').textContent = '';
        document.getElementById('display-subscribers').textContent = '';
        document.getElementById('display-avatar').removeAttribute('src');
        document.getElementById('profile-view-block').style.display = 'none';
        document.getElementById('profile-edit-block').style.display = 'block';
        parserStatus.textContent = '';
    }
    async function parseChannel() {
        const url = link.value.trim(), platform = window.selectedPlatformId;
        if (!url || !['youtube','telegram','vkontakte'].includes(platform)) return;
        parserRequest = new AbortController();
        parserStatus.textContent = 'Получаем название, аватар и подписчиков…';
        try {
            const response = await fetch('/market/avatar?platform=' + encodeURIComponent(platform) + '&url=' + encodeURIComponent(url), {signal:parserRequest.signal});
            const data = await response.json();
            if (url !== link.value.trim() || platform !== window.selectedPlatformId) return;
            if (!response.ok || !data.title || data.subscribers == null || !data.avatar) throw new Error(data.error || 'Данные получены не полностью.');
            const subscribers = String(data.subscribers).replace(/[^0-9]/g,'');
            if (!subscribers) throw new Error('Не удалось определить число подписчиков.');
            window.plglParsedChannel = {link:url,platform,title:data.title,avatar:data.avatar,subscribers};
            document.getElementById('display-name').textContent = data.title;
            document.getElementById('display-subscribers').textContent = subscribers + ' подписчиков';
            document.getElementById('display-avatar').src = data.avatar;
            document.getElementById('profile-edit-block').style.display = 'none';
            document.getElementById('profile-view-block').style.display = 'flex';
            parserStatus.textContent = 'Данные канала загружены. Перед размещением подтвердите владение кодом.';
            updatePreview();
        } catch (error) {
            if (error.name === 'AbortError') return;
            parserStatus.textContent = 'Не удалось получить данные автоматически. Заполните название, подписчиков и загрузите аватар вручную.';
            updatePreview();
        }
    }
    link.addEventListener('input', () => {
        resetParsedChannel(); updatePreview();
        parserTimer = setTimeout(parseChannel, 500);
    });
    platformSelect.addEventListener('change', () => { if (type === 1) parserTimer = setTimeout(parseChannel, 500); });
    document.addEventListener('plgl:parsed-reset', resetParsedChannel);

    new MutationObserver(updatePreview).observe(document.getElementById('display-name'), {childList:true});
    try {
        const { user } = await window.PlglAuth.session;
        if (!user) return;
        // Read contacts from the account API, not from a potentially stale storage copy.
        const response = await fetch('/account/get/data');
        if (response.ok) {
            const { user: own } = await response.json();
            const contacts = own?.contacts || {};
            forms.forEach(form => {
                for (const [name, value] of Object.entries({telegram:contacts.telegram,whatsapp:contacts.whatsapp,'e-mail':contacts.email || contacts['e-mail'] || own?.email})) {
                    const field = form.querySelector('[name="contacts[' + name + ']"]');
                    if (field && !field.value && typeof value === 'string') field.value = value;
                }
            });
        }
    } catch { window.PlglNotifications?.show('Не удалось подставить контакты. Заполните их вручную.', 'error'); }
    await load();
});
