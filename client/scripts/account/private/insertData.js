import { getData } from './getData.js';

const fallbackAvatar = '/assets/images/pl-gl-default-avatar.svg';

function getAvatarUrl(value) {
    if (!value || value.startsWith('../')) return fallbackAvatar;
    return value.startsWith('/') || /^https?:\/\//i.test(value) ? value : fallbackAvatar;
}

function setText(selector, value) {
    document.querySelectorAll(selector).forEach(element => { element.textContent = value; });
}

function createEmptyState(icon, title, text, action) {
    const wrapper = document.createElement('div');
    wrapper.className = 'empty-state';
    const iconElement = document.createElement('div');
    iconElement.className = 'empty-icon';
    iconElement.innerHTML = `<i class="${icon}"></i>`;
    const heading = document.createElement('h3');
    heading.textContent = title;
    const description = document.createElement('p');
    description.textContent = text;
    wrapper.append(iconElement, heading, description);
    if (action) wrapper.append(action);
    return wrapper;
}

function createListingAction(label, className, id) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `listing-action ${className}`;
    button.dataset.id = id;
    button.textContent = label;
    return button;
}

function getListingPath(listing, categories, platforms) {
    const category = categories.find(item => item.id === listing.category_id);
    const platform = category && platforms.find(item => item.id === category.platform_id);
    if (!category || !platform) return null;
    return `/market/${encodeURIComponent(platform.slug)}/${encodeURIComponent(category.name)}/items/${listing.id}`;
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews');
    if (!container) return;
    container.replaceChildren();
    if (!reviews.length) {
        container.append(createEmptyState('far fa-star', 'Пока нет отзывов', 'После завершения сделок здесь появятся отзывы пользователей.'));
        return;
    }
    reviews.forEach(review => {
        const item = document.createElement('article');
        item.className = 'activity-item';
        const content = document.createElement('div');
        const author = document.createElement('strong');
        author.textContent = review.author || 'Пользователь';
        const text = document.createElement('span');
        text.textContent = review.text || 'Отзыв без текста';
        content.append(author, text);
        item.append(content);
        container.append(item);
    });
}

function renderDeals(deals) {
    const container = document.getElementById('deals');
    if (!container) return;
    container.replaceChildren();
    if (!deals.length) {
        container.append(createEmptyState('fas fa-handshake', 'Пока нет сделок', 'Здесь будет отображаться история ваших сделок.'));
        return;
    }
    deals.forEach(deal => {
        const item = document.createElement('article');
        item.className = 'activity-item';
        item.textContent = `${deal.title || 'Сделка'} · ${deal.amount ?? '—'} ₽ · ${deal.status || 'В обработке'}`;
        container.append(item);
    });
}

function renderListings(listings, categories, platforms) {
    const container = document.getElementById('ads');
    if (!container) return;
    container.replaceChildren();
    if (!listings.length) {
        const createLink = document.createElement('a');
        createLink.className = 'primary-btn';
        createLink.href = '/pages/market/sell.html';
        createLink.textContent = 'Разместить объявление →';
        container.append(createEmptyState('fas fa-file-circle-plus', 'У вас пока нет активных объявлений', 'Разместите первое объявление и начните работать с YouTube-проектами.', createLink));
        return;
    }
    listings.forEach(listing => {
        const item = document.createElement('article');
        item.className = 'activity-item';
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = listing.name || 'Без названия';
        const details = document.createElement('small');
        details.textContent = `Цена: ${listing.price ?? 'не указана'} $`;
        content.append(title, details);
        const actions = document.createElement('div');
        actions.className = 'listing-actions';
        const path = getListingPath(listing, categories, platforms);
        if (path) {
            const edit = createListingAction('Открыть', 'btn-edit', listing.id);
            edit.dataset.path = path;
            actions.append(edit);
        }
        actions.append(createListingAction('Поднять', 'btn-up', listing.id), createListingAction('Удалить', 'btn-delete danger', listing.id));
        item.append(content, actions);
        container.append(item);
    });
}

async function request(url, options) {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    const response = await fetch(url, { ...options, headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || 'Не удалось выполнить действие');
    return body;
}

function bindListingActions() {
    const container = document.getElementById('ads');
    if (!container) return;
    container.addEventListener('click', async event => {
        const button = event.target.closest('button[data-id]');
        if (!button) return;
        if (button.classList.contains('btn-edit')) {
            window.location.href = button.dataset.path;
            return;
        }
        const listingId = button.dataset.id;
        try {
            if (button.classList.contains('btn-up')) {
                await request(`/market/listings/${listingId}/up`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId }) });
                await Swal.fire({ icon: 'success', title: 'Готово', text: 'Объявление поднято.' });
            }
            if (button.classList.contains('btn-delete')) {
                const result = await Swal.fire({ title: 'Удалить объявление?', text: 'Это действие нельзя отменить.', icon: 'warning', showCancelButton: true, confirmButtonText: 'Удалить', cancelButtonText: 'Отмена', confirmButtonColor: '#d33' });
                if (!result.isConfirmed) return;
                await request(`/market/listings/${listingId}/delete`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId }) });
                await Swal.fire({ icon: 'success', title: 'Удалено', text: 'Объявление удалено.' });
                window.location.reload();
            }
        } catch (error) {
            console.error('Ошибка управления объявлением:', error);
            Swal.fire({ icon: 'error', title: 'Ошибка', text: error.message });
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    bindListingActions();
    try {
        const data = await getData();
        if (!data?.user) throw new Error('Не удалось получить данные профиля');
        const { user, listings = [], reviews = [], deals = [], favorites = [], categories = [], platforms = [] } = data;
        const name = user.nickname || 'Пользователь PL-GL';
        const avatar = getAvatarUrl(user.avatar);
        setText('.profile-name', name);
        setText('.profile-desc', user.description || 'Начинающий продавец');
        document.querySelectorAll('.profile-img').forEach(image => { image.src = avatar; image.alt = `Аватар ${name}`; });
        document.querySelectorAll('.premium').forEach(element => { element.hidden = !user.is_premium; });
        document.querySelectorAll('.badge-verified').forEach(element => { element.hidden = !(user.verified || user.is_verified); });
        const stats = document.querySelectorAll('.hero-stat strong');
        if (stats[0]) stats[0].textContent = Number(user.rating || 0).toFixed(1);
        if (stats[1]) stats[1].textContent = deals.length;
        if (stats[2]) stats[2].textContent = reviews.length;
        const quickValues = document.querySelectorAll('.quick-value');
        if (quickValues[1]) quickValues[1].textContent = listings.length;
        if (quickValues[2]) quickValues[2].textContent = favorites.length;
        renderReviews(reviews);
        renderDeals(deals);
        renderListings(listings, categories, platforms);
    } catch (error) {
        console.error('Ошибка загрузки личного кабинета:', error);
        document.querySelector('.main-column')?.prepend(createEmptyState('fas fa-circle-exclamation', 'Кабинет недоступен', 'Не удалось загрузить данные. Обновите страницу или войдите снова.'));
    }
});
