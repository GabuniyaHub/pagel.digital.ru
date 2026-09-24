document.addEventListener('DOMContentLoaded', async () => {
    const platformSelect = document.getElementById('listing-platform');
    const categorySelect = document.getElementById('listing-category');
    const status = document.getElementById('selection-status');
    const retry = document.getElementById('reload-categories');
    const stepList = document.getElementById('composer-step-list');
    const channelForm = document.getElementById('listing-form');
    const serviceForm = document.getElementById('simple-listing-form');
    const channelRoot = document.querySelector('.form');
    const serviceRoot = document.querySelector('.create-listing-simple');
    const forms = [serviceForm, channelForm];
    const option = (text, value) => new Option(text, value);
    const dbName = 'plgl-listing-drafts';
    const draftKey = type => 'type-' + type;
    let platforms = [];
    let currentSection = 'category';
    let currentType = localStorage.getItem('plgl-sell-type') === '1' ? 1 : 2;
    const requestedType = new URLSearchParams(location.search).get('type');
    if (requestedType === 'channel') currentType = 1;
    else if (requestedType === 'service') currentType = 2;
    let draftDb, saveTimer, parserTimer, parserRequest, restoringDraft = false, suppressDraftSave = false, coverUrl = null;
    let currentWorkflow = [];
    const sections = new Map();
    const validChannelUrl = value => /^https:\/\/(www\.)?youtube\.com\/channel\/[A-Za-z0-9_-]+\/?(?:[?#].*)?$/i.test(value);
    let previewAvatarSource = '', previewAvatarUrl = '', previewAvatarRequest;

    function loadPreviewAvatar(source) {
        if (source === previewAvatarSource) return;
        previewAvatarSource = source;
        previewAvatarRequest?.abort();
        if (previewAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
        previewAvatarUrl = '';
        if (!source) return;
        const controller = new AbortController();
        previewAvatarRequest = controller;
        // Use the same authenticated image loader as channel publication.
        fetch('/market/avatar-image?url=' + encodeURIComponent(source), { signal: controller.signal })
            .then(async response => {
                if (!response.ok) throw new Error('Аватар недоступен');
                const blob = await response.blob();
                if (controller.signal.aborted) return;
                previewAvatarUrl = URL.createObjectURL(blob);
                updatePreview();
            })
            .catch(() => { /* The original URL remains a fallback. */ });
    }

    function openDraftDb() {
        return new Promise((resolve, reject) => {
            if (!('indexedDB' in window)) return reject(new Error('Черновики недоступны в этом браузере.'));
            const request = indexedDB.open(dbName, 1);
            request.onupgradeneeded = () => request.result.createObjectStore('drafts');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    function draftRequest(mode, callback) {
        return new Promise((resolve, reject) => {
            const transaction = draftDb.transaction('drafts', mode);
            const request = callback(transaction.objectStore('drafts'));
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    const readDraft = type => draftRequest('readonly', store => store.get(draftKey(type)));
    const writeDraft = (type, value) => draftRequest('readwrite', store => store.put(value, draftKey(type)));
    const deleteDraft = type => draftRequest('readwrite', store => store.delete(draftKey(type)));

    function activeForm() { return currentType === 1 ? channelForm : serviceForm; }
    function valueOf(form, selector) { return form.querySelector(selector)?.value?.trim() || ''; }
    function channelParsedForCurrentLink() {
        return window.plglParsedChannel?.link === valueOf(channelForm, '#link') ? window.plglParsedChannel : null;
    }
    function saveDraftSoon() {
        if (restoringDraft || suppressDraftSave || !draftDb) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
            const form = activeForm();
            const values = {};
            const files = {};
            for (const field of form.elements) {
                if (!field.name) continue;
                if (field.type === 'file') {
                    if (field.files?.[0]) files[field.name] = { blob: field.files[0], name: field.files[0].name, type: field.files[0].type };
                } else if (field.type === 'checkbox') values[field.name] = field.checked;
                else if (field.type !== 'radio') values[field.name] = field.value;
            }
            try {
                await writeDraft(currentType, {
                    type: currentType,
                    category: categorySelect.value,
                    step: currentSection,
                    values,
                    files,
                    parsedChannel: channelParsedForCurrentLink()
                });
                localStorage.setItem('plgl-sell-type', String(currentType));
                document.getElementById('composer-progress').dataset.saved = 'true';
                document.getElementById('composer-progress').title = 'Черновик сохранён на этом устройстве';
                updateProgress();
            } catch (error) {
                console.warn('Черновик объявления не сохранён:', error);
            }
        }, 300);
    }
    async function restoreDraft(type) {
        if (!draftDb) return null;
        const draft = await readDraft(type).catch(() => null);
        if (!draft) return null;
        document.getElementById('composer-progress').dataset.saved = 'true';
        restoringDraft = true;
        try {
            const form = type === 1 ? channelForm : serviceForm;
            for (const [name, value] of Object.entries(draft.values || {})) {
                const field = [...form.elements].find(item => item.name === name && item.type !== 'file');
                if (!field) continue;
                if (field.type === 'checkbox') field.checked = Boolean(value);
                else field.value = value;
            }
            for (const [name, savedFile] of Object.entries(draft.files || {})) {
                const input = [...form.elements].find(item => item.name === name && item.type === 'file');
                if (!input || !savedFile?.blob) continue;
                try {
                    const transfer = new DataTransfer();
                    transfer.items.add(new File([savedFile.blob], savedFile.name || 'listing-image', { type: savedFile.type || savedFile.blob.type }));
                    input.files = transfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                } catch { /* Some browsers do not allow restoring FileList programmatically. */ }
            }
            if (type === 1 && draft.parsedChannel?.link === valueOf(channelForm, '#link')) {
                window.plglParsedChannel = draft.parsedChannel;
                document.getElementById('display-name').textContent = draft.parsedChannel.title;
                document.getElementById('display-subscribers').textContent = Number(draft.parsedChannel.subscribers).toLocaleString('ru-RU') + ' подписчиков';
                document.getElementById('display-avatar').src = draft.parsedChannel.avatar;
                document.getElementById('profile-edit-block').style.display = 'none';
                document.getElementById('profile-view-block').style.display = 'flex';
                document.querySelector('.parser-status').textContent = 'Данные канала восстановлены из черновика.';
            } else if (type === 1 && valueOf(channelForm, '#link')) {
                parserTimer = setTimeout(parseChannel, 150);
            }
            categorySelect.value = draft.category || '';
            selectCategory(false);
            renderWorkflow(type);
            updatePreview();
            const section = currentWorkflow.some(item => item.key === draft.step) ? draft.step : 'category';
            openStep(section, false);
            return draft;
        } finally {
            restoringDraft = false;
        }
    }

    function updatePreview() {
        const channelUrl = valueOf(channelForm, '#link');
        document.querySelector('.channel-link-help').hidden = currentType !== 1 || !channelUrl || validChannelUrl(channelUrl);
        syncThemePicker();
        const simple = currentType === 2;
        const form = activeForm();
        const title = (!simple && channelParsedForCurrentLink()?.title) || valueOf(form, simple ? '#simple-title' : '#profile-name');
        document.getElementById('live-title').textContent = title || 'Здесь появится название';
        document.getElementById('live-description').textContent = form.elements.description.value || 'Добавьте описание: что вы предлагаете и чем это полезно покупателю.';
        const price = form.elements.price?.value || '';
        document.getElementById('live-price').textContent = price ? new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(price)) : 'Цена не указана';
        document.getElementById('live-category').textContent = window.selectedProduct ? 'YouTube / ' + categorySelect.selectedOptions[0].textContent : 'ВАШЕ ПРЕДЛОЖЕНИЕ';
        const file = form.querySelector('input[type="file"]')?.files?.[0];
        const image = document.getElementById('live-cover');
        if (coverUrl) URL.revokeObjectURL(coverUrl);
        coverUrl = file ? URL.createObjectURL(file) : null;
        const parsed = channelParsedForCurrentLink();
        loadPreviewAvatar(!simple && parsed?.avatar || '');
        const artwork = {
            design: '/assets/images/youtube-catalog/05-youtube-design.png',
            editing: '/assets/images/youtube-catalog/04-youtube-editing.png',
            promotion: '/assets/images/youtube-catalog/03-youtube-promotion.png',
            'channel-buy': '/assets/images/youtube-catalog/02-youtube-channel-sell.png',
            'channel-sell': '/assets/images/youtube-catalog/02-youtube-channel-sell.png',
            content: '/assets/images/youtube-catalog/06-youtube-content.png',
            voiceover: '/assets/images/youtube-catalog/07-youtube-voiceover.png',
            'other-services': '/assets/images/youtube-catalog/08-youtube-services.png',
            analytics: '/assets/images/youtube-catalog/11-youtube-analytics.png',
            'content-under-key': '/assets/images/youtube-catalog/12-youtube-content-under-key.png',
            'audience-growth': '/assets/images/youtube-catalog/13-youtube-audience-growth.png'
        };
        const source = (!simple && parsed?.avatar && (previewAvatarUrl || parsed.avatar)) || coverUrl || artwork[window.selectedProduct?.id];
        image.referrerPolicy = 'no-referrer';
        image.hidden = !source;
        document.getElementById('live-placeholder').hidden = !!source;
        if (source) image.src = source; else image.removeAttribute('src');
        image.classList.toggle('channel-cover', !simple);
        const subscribers = document.getElementById('live-subscribers');
        const subscriberCount = parsed?.subscribers || valueOf(channelForm, '#profile-subscribers');
        subscribers.hidden = simple || !subscriberCount;
        subscribers.textContent = !simple && subscriberCount ? Number(subscriberCount).toLocaleString('ru-RU') + ' подписчиков' : '';
        document.getElementById('channel-parsed-card').hidden = simple || currentSection !== 'channel';
        document.getElementById('channel-example').hidden = true;
        document.getElementById('parsed-channel-name').textContent = parsed?.title || 'Название появится после вставки ссылки';
        document.getElementById('parsed-channel-subscribers').textContent = parsed?.subscribers ? Number(parsed.subscribers).toLocaleString('ru-RU') + ' подписчиков' : 'Подписчики определятся автоматически';
        const parsedAvatar = document.getElementById('parsed-channel-avatar');
        parsedAvatar.hidden = !parsed?.avatar;
        parsedAvatar.referrerPolicy = 'no-referrer';
        if (parsed?.avatar) parsedAvatar.src = previewAvatarUrl || parsed.avatar; else parsedAvatar.removeAttribute('src');
        document.getElementById('channel-parse-hint').textContent = parsed
            ? 'Данные канала загружены автоматически. Проверьте их перед публикацией.'
            : 'Вставьте ссылку на YouTube-канал — название, аватар и аудитория загрузятся автоматически.';
        updateProgress();
    }

    function makeSection(key, title) {
        const details = document.createElement('details');
        details.className = 'composer-section';
        details.dataset.section = key;
        const summary = document.createElement('summary');
        const heading = document.createElement('span');
        heading.textContent = title;
        summary.append(heading);
        const note = document.createElement('small');
        summary.append(note);
        const body = document.createElement('div');
        body.className = 'composer-body';
        details.append(summary, body);
        details.open = true;
        summary.addEventListener('click', event => { event.preventDefault(); openStep(key); });
        sections.set(key, details);
        return { key, title, details, body };
    }
    const categorySection = makeSection('category', 'Категория');
    const categoryCard = document.querySelector('.selection-card');
    categoryCard.before(categorySection.details);
    categorySection.body.append(categoryCard);

    const channelParts = {
        channel: makeSection('channel', 'Канал и парсинг'),
        description: makeSection('description', 'Описание'),
        terms: makeSection('terms', 'Цена и условия'),
        contacts: makeSection('contacts', 'Контакты и подтверждение')
    };
    // Resolve fields before moving their parents into detached stage containers.
    const channelPriceRow = channelForm.querySelector('#price').closest('.form-row');
    channelPriceRow.classList.add('channel-price-row');
    channelParts.terms.body.append(channelPriceRow);
    channelParts.channel.body.append(channelForm.querySelector('.header-form-listing'));
    channelParts.description.body.append(channelForm.querySelector('.body-form-listing'));
    channelParts.contacts.body.append(channelForm.querySelector('.footer-form-listing'));
    Object.values(channelParts).forEach(part => channelForm.append(part.details));

    const serviceParts = { details: makeSection('details', 'Детали услуги'), publish: makeSection('publish', 'Цена и контакты') };
    [...serviceForm.childNodes].forEach(node => {
        const isDetails = node.nodeType === Node.ELEMENT_NODE && node.matches('label[for="simple-title"], #simple-title, label[for="simple-description"], #simple-description, label[for="simple-cover"], .cover-upload-block');
        (isDetails ? serviceParts.details.body : serviceParts.publish.body).append(node);
    });
    Object.values(serviceParts).forEach(part => serviceForm.append(part.details));

    const workflows = {
        1: [categorySection, channelParts.channel, channelParts.description, channelParts.terms, channelParts.contacts],
        2: [categorySection, serviceParts.details, serviceParts.publish]
    };
    function renderWorkflow(type) {
        currentWorkflow = workflows[type];
        document.querySelectorAll('[data-offer-type]').forEach(button => {
            const selected = Number(button.dataset.offerType) === type;
            button.classList.toggle('selected', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        document.querySelectorAll('[data-generated-step-control]').forEach(button => button.remove());
        stepList.replaceChildren();
        currentWorkflow.forEach((step, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.dataset.step = step.key;
            button.innerHTML = '<span>' + String(index + 1).padStart(2, '0') + '</span>';
            const text = document.createElement('strong');
            text.append(document.createTextNode(step.title));
            const hint = document.createElement('small');
            hint.textContent = ({ category: 'Выберите предложение', channel: 'Ссылка и данные YouTube', description: 'Расскажите о канале', terms: 'Цена и комментарии к объявлению', contacts: 'Способ связи и владение', details: 'Название, описание, обложка', publish: 'Стоимость и способ связи' })[step.key];
            text.append(hint);
            button.append(text);
            button.addEventListener('click', () => openStep(step.key));
            stepList.append(button);
        });
        buildStepControls();
        document.querySelectorAll('.composer-section').forEach(section => section.classList.remove('is-current'));
        openStep('category', false);
        updateProgress();
        document.body.classList.add('sell-workflow-ready');
    }
    function setActiveStep(step) {
        currentSection = step;
        currentWorkflow.forEach(item => item.details.classList.toggle('is-current', item.key === step));
        document.getElementById('channel-parsed-card').hidden = currentType !== 1 || step !== 'channel';
        stepList.querySelectorAll('[data-step]').forEach(button => {
            if (button.dataset.step === step) button.setAttribute('aria-current', 'step');
            else button.removeAttribute('aria-current');
        });
        saveDraftSoon();
    }
    function openStep(step, scroll = true) {
        if (step !== 'category' && !window.selectedProduct) {
            status.textContent = 'Сначала выберите категорию объявления.';
            step = 'category';
        }
        if (!currentWorkflow.some(item => item.key === step)) return;
        setActiveStep(step);
        if (scroll) {
            const section = sections.get(step);
            const target = section?.querySelector('.composer-body')?.firstElementChild || section;
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    function validStep(step) {
        return !stepError(step);
    }
    function stepError(step) {
        const form = activeForm();
        const parsed = channelParsedForCurrentLink();
        const contactFields = [...form.querySelectorAll('[name^="contacts["]')];
        const hasContact = contactFields.some(field => field.value.trim());
        const error = (selector, message) => ({ field: form.querySelector(selector), message });
        const textValid = selector => {
            const field = form.querySelector(selector);
            return field.checkValidity() && field.value.trim().length >= Math.max(1, field.minLength);
        };
        const priceValid = selector => {
            const field = form.querySelector(selector);
            return field.checkValidity() && /^\d+(\.\d{1,2})?$/.test(field.value) && Number(field.value) > 0;
        };
        if (step === 'category') return window.selectedProduct ? null : { field: categorySelect, message: 'Выберите категорию объявления.' };
        if (currentType === 2) {
            if (step === 'details') {
                if (!textValid('#simple-title')) return error('#simple-title', 'Укажите название услуги: от 5 до 100 символов.');
                if (!textValid('#simple-description')) return error('#simple-description', 'Добавьте описание услуги: от 10 до 500 символов.');
                if (!form.querySelector('#simple-cover').files.length) return error('.cover-upload-label', 'Загрузите обложку услуги на этом этапе.');
            }
            if (step === 'publish' && !priceValid('#simple-price')) return error('#simple-price', 'Укажите цену услуги больше нуля (до двух знаков после точки).');
        } else {
            if (step === 'channel') {
                const identityReady = parsed || (textValid('#profile-name') && valueOf(form, '#profile-name').length >= 3 &&
                    valueOf(form, '#profile-subscribers') !== '' && form.querySelector('#profile-subscribers').checkValidity() &&
                    form.querySelector('#profile-avatar-input').files.length > 0);
                if (!validChannelUrl(valueOf(form, '#link'))) return error('#link', 'Вставьте ссылку вида https://www.youtube.com/channel/ID канала.');
                if (!form.querySelector('#theme').value) return error('#theme-trigger', 'Выберите тематику канала.');
                if (!identityReady) return error('#link', 'Дождитесь загрузки данных канала или заполните название, подписчиков и аватар вручную.');
            }
            if (step === 'description' && !textValid('#description')) return error('#description', 'Добавьте описание канала: от 10 до 500 символов.');
            if (step === 'terms' && !priceValid('#price')) return error('#price', 'Укажите цену канала больше нуля (до двух знаков после точки).');
            if (step === 'contacts' && !form.querySelector('#flex_switch').checked) return error('#flex_switch', 'Подтвердите согласие с правилами размещения.');
        }
        if ((step === 'contacts' || step === 'publish') && !hasContact) return error('[name^="contacts["]', 'Добавьте хотя бы один контакт для связи.');
        return null;
    }
    function showStepError(step) {
        const error = stepError(step);
        if (!error) return;
        const section = sections.get(step);
        let message = section.querySelector('.stage-error');
        if (!message) {
            message = document.createElement('p');
            message.className = 'stage-error';
            message.setAttribute('role', 'alert');
            section.querySelector('.composer-body').prepend(message);
        }
        message.textContent = error.message;
        error.field?.focus();
    }
    function buildStepControls() {
        currentWorkflow.forEach((step, index) => {
            const body = step.body;
            if (index > 0) {
                const back = document.createElement('button');
                back.type = 'button';
                back.className = 'composer-next composer-prev';
                back.dataset.generatedStepControl = 'true';
                back.textContent = '← Назад';
                back.addEventListener('click', () => openStep(currentWorkflow[index - 1].key));
                body.append(back);
            }
            if (index < currentWorkflow.length - 1) {
                const next = document.createElement('button');
                next.type = 'button';
                next.className = 'composer-next';
                next.dataset.generatedStepControl = 'true';
                next.textContent = 'Продолжить →';
                next.addEventListener('click', async () => {
                    if (currentType === 1 && step.key === 'channel' && !channelParsedForCurrentLink() && link.value.trim()) {
                        clearTimeout(parserTimer);
                        await parseChannel();
                    }
                    if (!validStep(step.key)) return showStepError(step.key);
                    openStep(currentWorkflow[index + 1].key);
                });
                body.append(next);
            }
        });
    }

    function stepComplete(step) {
        if (step.key === 'category') return Boolean(window.selectedProduct);
        return validStep(step.key);
    }
    function updateProgress() {
        if (!currentWorkflow.length || !document.querySelector('[data-section="category"]')) return;
        const complete = currentWorkflow.filter(stepComplete).length;
        const progress = document.getElementById('composer-progress');
        progress.textContent = 'Заполнено ' + complete + ' из ' + currentWorkflow.length + ' этапов' + (progress.dataset.saved === 'true' ? ' · Черновик сохранён' : '');
        currentWorkflow.forEach(step => {
            const button = stepList.querySelector('[data-step="' + step.key + '"]');
            button?.classList.toggle('complete', stepComplete(step));
        });
        categorySection.details.querySelector('summary small').textContent = window.selectedProduct?.description || 'Выберите предложение';
    }

    async function selectCategory(advance = true) {
        const platform = platforms.find(item => item.id === platformSelect.value);
        const product = platform?.products?.find(item => item.id === categorySelect.value && Number(item.formType) === currentType);
        window.selectedPlatformId = platform?.id;
        window.selectedProduct = product || null;
        channelRoot.style.display = product && currentType === 1 ? 'block' : 'none';
        serviceRoot.style.display = product && currentType === 2 ? 'block' : 'none';
        status.hidden = Boolean(product);
        status.textContent = product ? 'Категория выбрана. Продолжите заполнение по этапам.' : 'Выберите доступную категорию.';
        updatePreview();
        saveDraftSoon();
        if (product && advance) openStep(currentType === 1 ? 'channel' : 'details', false);
    }
    async function selectPlatform(advance = true) {
        const platform = platforms.find(item => item.id === platformSelect.value);
        const products = (platform?.products || []).filter(item => Number(item.formType) === currentType);
        categorySelect.replaceChildren(option('Выберите категорию', ''));
        products.forEach(item => categorySelect.add(option(item.description || item.name, item.id)));
        categorySelect.disabled = !products.length;
        const preferred = currentType === 1 ? 'channel-buy' : 'design';
        categorySelect.value = products.find(item => item.id === preferred)?.id || products[0]?.id || '';
        resetParsedChannel();
        await selectCategory(advance);
        if (!products.length) status.textContent = 'Для этого типа объявления пока нет категорий YouTube.';
        document.getElementById('display-name').textContent = '';
        document.getElementById('display-subscribers').textContent = '';
        document.getElementById('profile-edit-block').style.display = 'block';
        document.getElementById('profile-view-block').style.display = 'none';
    }

    async function switchType(type) {
        if (type === currentType) return;
        await persistNow();
        suppressDraftSave = true;
        currentType = type;
        localStorage.setItem('plgl-sell-type', String(type));
        renderWorkflow(type);
        await selectPlatform(false);
        const saved = await restoreDraft(type);
        suppressDraftSave = false;
        if (!saved) openStep('category', false);
        updatePreview();
    }

    function resetParsedChannel() {
        clearTimeout(parserTimer);
        parserRequest?.abort();
        window.plglParsedChannel = null;
        document.getElementById('display-name').textContent = '';
        document.getElementById('display-subscribers').textContent = '';
        document.getElementById('display-avatar').removeAttribute('src');
        document.getElementById('profile-view-block').style.display = 'none';
        document.getElementById('profile-edit-block').style.display = 'block';
        const parserStatus = document.querySelector('.parser-status');
        if (parserStatus) parserStatus.textContent = '';
        updatePreview();
    }
    const link = document.getElementById('link');
    const parserStatus = document.createElement('p');
    parserStatus.className = 'parser-status';
    parserStatus.setAttribute('role', 'status');
    link.parentElement.after(parserStatus);
    async function parseChannel() {
        const url = link.value.trim();
        if (currentType !== 1 || !url) return;
        if (!validChannelUrl(url)) {
            parserStatus.textContent = 'Для автоматического определения данных вставьте исходную ссылку youtube.com/channel/ID из настроек канала.';
            updatePreview();
            return;
        }
        parserRequest?.abort();
        const requestController = new AbortController();
        parserRequest = requestController;
        parserStatus.textContent = 'Получаем название, аватар и число подписчиков…';
        try {
            const response = await fetch('/market/avatar?platform=youtube&url=' + encodeURIComponent(url), { signal: requestController.signal });
            const data = await response.json();
            if (url !== link.value.trim() || currentType !== 1) return;
            if (!response.ok || !data.title || data.subscribers == null || !data.avatar) throw new Error(data.error || 'Не удалось получить данные канала.');
            const subscribers = String(data.subscribers).replace(/[^0-9]/g, '');
            if (!subscribers) throw new Error('YouTube не вернул число подписчиков.');
            window.plglParsedChannel = { link: url, platform: 'youtube', title: data.title, avatar: data.avatar, subscribers };
            document.getElementById('display-name').textContent = data.title;
            document.getElementById('display-subscribers').textContent = Number(subscribers).toLocaleString('ru-RU') + ' подписчиков';
            document.getElementById('display-avatar').src = data.avatar;
            document.getElementById('profile-edit-block').style.display = 'none';
            document.getElementById('profile-view-block').style.display = 'flex';
            parserStatus.textContent = 'Данные и аватар канала загружены автоматически.';
            updatePreview();
            saveDraftSoon();
        } catch (error) {
            if (error.name === 'AbortError') return;
            parserStatus.textContent = 'Не удалось распознать ссылку. Проверьте её или заполните данные канала вручную.';
            updatePreview();
        }
    }
    link.addEventListener('input', () => {
        resetParsedChannel();
        parserTimer = setTimeout(parseChannel, 500);
        saveDraftSoon();
    });
    forms.forEach(form => {
        // Validate the whole wizard ourselves so hidden fields never swallow submit.
        form.noValidate = true;
        const onEdit = () => {
            form.querySelectorAll('.stage-error').forEach(message => message.remove());
            updatePreview(); saveDraftSoon();
        };
        form.addEventListener('input', onEdit);
        form.addEventListener('change', onEdit);
        let busy = false;
        form.addEventListener('submit', event => {
            if (busy) { event.preventDefault(); event.stopImmediatePropagation(); return; }
            const invalid = currentWorkflow.find(step => !validStep(step.key));
            if (invalid) {
                event.preventDefault(); event.stopImmediatePropagation();
                openStep(invalid.key);
                showStepError(invalid.key);
            }
        }, true);
        const button = form.querySelector('button[type="submit"]');
        const original = button?.textContent || 'Разместить объявление';
        form.addEventListener('plgl:busy', event => {
            busy = event.detail;
            if (button) { button.disabled = busy; button.textContent = busy ? 'Размещаем…' : original; }
        });
    });
    document.querySelectorAll('[data-offer-type]').forEach(button => button.addEventListener('click', () => switchType(Number(button.dataset.offerType))));
    platformSelect.addEventListener('change', () => selectPlatform());
    categorySelect.addEventListener('change', () => selectCategory());
    retry.addEventListener('click', loadCatalog);

    async function persistNow() {
        clearTimeout(saveTimer);
        saveTimer = null;
        if (!restoringDraft && !suppressDraftSave && draftDb) {
            const form = activeForm();
            const values = {}, files = {};
            for (const field of form.elements) {
                if (!field.name) continue;
                if (field.type === 'file') {
                    if (field.files?.[0]) files[field.name] = { blob: field.files[0], name: field.files[0].name, type: field.files[0].type };
                } else if (field.type === 'checkbox') values[field.name] = field.checked;
                else if (field.type !== 'radio') values[field.name] = field.value;
            }
            await writeDraft(currentType, { type: currentType, category: categorySelect.value, step: currentSection, values, files, parsedChannel: channelParsedForCurrentLink() }).catch(() => {});
        }
    }
    async function clearCurrentDraft() {
        if (draftDb) await deleteDraft(currentType).catch(() => {});
        document.getElementById('composer-progress').dataset.saved = 'false';
        localStorage.removeItem('plgl-sell-type');
        updateProgress();
    }
    window.plglClearSellDraft = clearCurrentDraft;

    async function loadCatalog() {
        retry.hidden = true;
        status.hidden = false;
        status.textContent = 'Загружаем категории YouTube…';
        try {
            const response = await fetch('/market/platforms');
            if (!response.ok) throw new Error('Не удалось загрузить категории.');
            const catalog = await response.json();
            platforms = Array.isArray(catalog) ? catalog.filter(platform => platform.id === 'youtube') : [];
            if (!platforms.length) throw new Error('Категории YouTube временно недоступны.');
            platformSelect.replaceChildren(option('YouTube', 'youtube'));
            platformSelect.value = 'youtube';
            platformSelect.disabled = false;
            suppressDraftSave = true;
            await selectPlatform(false);
            const draft = await restoreDraft(currentType);
            suppressDraftSave = false;
            if (!draft) openStep('category', false);
        } catch (error) {
            status.textContent = error.message + ' Попробуйте ещё раз.';
            retry.hidden = false;
        }
    }

    function syncThemePicker() {
        const select = document.getElementById('theme');
        const trigger = document.getElementById('theme-trigger');
        if (!trigger) return;
        trigger.textContent = select.selectedOptions[0]?.textContent || 'Выберите тематику';
        document.querySelectorAll('#theme-options [role="option"]').forEach(item => {
            item.setAttribute('aria-selected', String(item.dataset.value === select.value));
        });
    }
    function setupThemePicker() {
        const select = document.getElementById('theme');
        const picker = document.createElement('div');
        picker.className = 'theme-picker';
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.id = 'theme-trigger';
        trigger.className = 'theme-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', 'theme-options');
        trigger.setAttribute('aria-labelledby', 'theme-label theme-trigger');
        const popup = document.createElement('div');
        popup.className = 'theme-popup';
        popup.hidden = true;
        const search = document.createElement('input');
        search.type = 'search';
        search.placeholder = 'Найти тематику';
        search.setAttribute('aria-label', 'Найти тематику канала');
        const list = document.createElement('div');
        list.id = 'theme-options';
        list.setAttribute('role', 'listbox');
        list.setAttribute('aria-labelledby', 'theme-label');
        const empty = document.createElement('p');
        empty.textContent = 'Ничего не найдено';
        empty.hidden = true;
        const close = (focus = false) => {
            popup.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (focus) trigger.focus();
        };
        const items = [...select.options].filter(item => item.value).map(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.tabIndex = -1;
            button.textContent = option.textContent;
            button.dataset.value = option.value;
            button.setAttribute('role', 'option');
            button.addEventListener('click', () => {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                close(true);
            });
            list.append(button);
            return button;
        });
        search.addEventListener('input', () => {
            const query = search.value.trim().toLocaleLowerCase('ru');
            items.forEach(item => { item.hidden = !item.textContent.toLocaleLowerCase('ru').includes(query); });
            empty.hidden = items.some(item => !item.hidden);
        });
        const open = () => {
            popup.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
            search.value = '';
            search.dispatchEvent(new Event('input'));
            search.focus();
        };
        trigger.addEventListener('click', () => popup.hidden ? open() : close());
        picker.addEventListener('keydown', event => {
            if (event.key === 'Escape') { event.preventDefault(); close(true); }
            if (event.key === 'Enter' && event.target === search) {
                event.preventDefault();
                items.find(item => !item.hidden)?.click();
            }
            if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
                event.preventDefault();
                if (popup.hidden) open();
                const visible = items.filter(item => !item.hidden);
                const index = visible.indexOf(document.activeElement);
                const next = index < 0 ? (event.key === 'ArrowDown' ? 0 : visible.length - 1)
                    : (index + (event.key === 'ArrowDown' ? 1 : -1) + visible.length) % visible.length;
                visible[next]?.focus();
            }
            if (event.key === 'Tab') close();
        });
        document.addEventListener('click', event => { if (!picker.contains(event.target)) close(); });
        popup.append(search, list, empty);
        picker.append(trigger, popup);
        select.after(picker);
        select.hidden = true;
        document.getElementById('theme-label').htmlFor = trigger.id;
        select.addEventListener('change', syncThemePicker);
        syncThemePicker();
    }
    // Keep labels visible after placeholder text disappears.
    document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]):not([type=radio]), main textarea, main select').forEach((field, index) => {
        if (!field.id) field.id = 'sell-field-' + index;
        if (field.closest('label') || document.querySelector('label[for="' + field.id + '"]')) return;
        const label = document.createElement('label');
        label.htmlFor = field.id;
        label.textContent = field.placeholder?.split(', например:')[0] || 'Значение';
        field.before(label);
    });
    setupThemePicker();
    const uploadLabel = document.querySelector('.cover-upload-label');
    uploadLabel.tabIndex = 0;
    uploadLabel.setAttribute('role', 'button');
    uploadLabel.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            document.getElementById('simple-cover').click();
        }
    });
    renderWorkflow(currentType);

    // Profile menu is a button + an independent popup, so clicking it never races its link.
    const profileToggle = document.getElementById('profile-menu-toggle');
    const profileMenu = document.getElementById('profile-menu');
    const closeProfileMenu = () => { profileMenu.hidden = true; profileToggle.setAttribute('aria-expanded', 'false'); };
    profileToggle.addEventListener('click', event => {
        event.stopPropagation();
        profileMenu.hidden = !profileMenu.hidden;
        profileToggle.setAttribute('aria-expanded', String(!profileMenu.hidden));
    });
    document.addEventListener('click', event => { if (!profileMenu.contains(event.target) && !profileToggle.contains(event.target)) closeProfileMenu(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeProfileMenu(); });
    document.getElementById('sell-logout').addEventListener('click', async () => {
        try { await fetch('/account/logout', { method: 'POST' }); } catch {}
        ['jwt', 'user'].forEach(key => { localStorage.removeItem(key); sessionStorage.removeItem(key); });
        location.assign('/pages/user-auth/login.html');
    });
    try {
        const { user } = await window.PlglAuth.session;
        if (user) {
            document.querySelector('.header-user-name').textContent = user.nickname || user.name || 'Профиль';
            if (user.avatar && !user.avatar.startsWith('../')) document.querySelector('.header-avatar').src = user.avatar;
            document.querySelector('.header-avatar').addEventListener('error', event => { event.currentTarget.src = '/assets/images/pl-gl-default-avatar.svg'; }, { once: true });
            const response = await fetch('/account/get/data');
            if (response.ok) {
                const { user: own } = await response.json();
                const contacts = own?.contacts || {};
                forms.forEach(form => {
                    for (const [name, value] of Object.entries({ telegram: contacts.telegram, whatsapp: contacts.whatsapp, 'e-mail': contacts.email || contacts['e-mail'] || own?.email })) {
                        const field = form.querySelector('[name="contacts[' + name + ']"]');
                        if (field && !field.value && typeof value === 'string') field.value = value;
                    }
                });
            }
        }
    } catch { window.PlglNotifications?.show('Не удалось загрузить профильные данные.', 'error'); }
    draftDb = await openDraftDb().catch(() => null);
    await loadCatalog();
});
