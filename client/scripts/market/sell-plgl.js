document.addEventListener('DOMContentLoaded', async () => {
    const platformSelect = document.getElementById('listing-platform');
    const categorySelect = document.getElementById('listing-category');
    const status = document.getElementById('selection-status');
    const retry = document.getElementById('reload-categories');
    const preview = document.getElementById('listing-preview');
    if (matchMedia('(max-width:800px)').matches) preview.open = false;
    let platforms = [], type = 2, coverUrl = null;
    const channel = document.querySelector('.form');
    const service = document.querySelector('.create-listing-simple');
    const forms = [...document.querySelectorAll('main form')];
    const option = (text, value) => new Option(text, value);
    function updatePreview() {
        const simple = type === 2;
        const form = document.getElementById(simple ? 'simple-listing-form' : 'listing-form');
        const title = document.getElementById(simple ? 'simple-title' : 'profile-name').value
            || (!simple && document.getElementById('display-name').textContent);
        document.getElementById('live-title').textContent = title || 'Здесь появится название';
        document.getElementById('live-description').textContent = form.elements.description.value || 'Добавьте описание: что вы предлагаете и чем это полезно покупателю.';
        const price = form.elements.price.value;
        document.getElementById('live-price').textContent = price !== '' ? new Intl.NumberFormat('ru-RU', {style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(price)) : 'Цена не указана';
        document.getElementById('live-category').textContent = window.selectedProduct ? platformSelect.selectedOptions[0].textContent + ' / ' + categorySelect.selectedOptions[0].textContent : 'ВАШЕ ПРЕДЛОЖЕНИЕ';
        const file = document.getElementById(simple ? 'simple-cover' : 'profile-avatar-input').files[0];
        const image = document.getElementById('live-cover');
        if (coverUrl) URL.revokeObjectURL(coverUrl);
        coverUrl = file ? URL.createObjectURL(file) : null;
        image.hidden = !coverUrl;
        document.getElementById('live-placeholder').hidden = !!coverUrl;
        if (coverUrl) image.src = coverUrl; else image.removeAttribute('src');
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
    }
    function selectPlatform() {
        const platform = platforms.find(p => p.id === platformSelect.value);
        const products = (platform?.products || []).filter(p => Number(p.formType) === type);
        categorySelect.replaceChildren(option('Выберите категорию', ''));
        products.forEach(p => categorySelect.add(option(p.description || p.name, p.id)));
        categorySelect.disabled = !products.length;
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
            platformSelect.value = platforms.some(p => p.id === 'youtube') ? 'youtube' : platforms[0].id;
            platformSelect.disabled = false;
            selectPlatform();
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
