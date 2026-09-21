import { getPublicData } from './getDataPublic.js';

const fallbackAvatar = '../../assets/images/pl-gl-default-avatar.svg';

function setText(selector, value) {
    document.querySelectorAll(selector).forEach(element => {
        element.textContent = value;
    });
}

function createEmptyState(icon, title, text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'empty-state';
    wrapper.innerHTML = `
        <div class="empty-icon"><i class="${icon}"></i></div>
        <h3></h3>
        <p></p>
    `;
    wrapper.querySelector('h3').textContent = title;
    wrapper.querySelector('p').textContent = text;
    return wrapper;
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews');
    container.replaceChildren();

    if (!reviews.length) {
        container.appendChild(createEmptyState('far fa-star', 'Пока нет отзывов', 'Отзывы появятся после завершения сделок.'));
        return;
    }

    reviews.forEach(review => {
        const item = document.createElement('article');
        item.className = 'public-listing';
        item.textContent = `${review.author || 'Пользователь'}: ${review.text || 'Без текста'}`;
        container.appendChild(item);
    });
}

function renderListings(listings, categories, platforms) {
    const container = document.getElementById('ads');
    container.replaceChildren();

    if (!listings.length) {
        container.appendChild(createEmptyState('fas fa-file-circle-plus', 'Активных объявлений пока нет', 'Когда пользователь разместит объявление, оно появится здесь.'));
        return;
    }

    listings.forEach(listing => {
        const category = categories.find(item => item.id === listing.category_id);
        const platform = category && platforms.find(item => item.id === category.platform_id);
        const item = document.createElement('a');
        item.className = 'public-listing';
        item.href = platform
            ? `/market/${encodeURIComponent(platform.slug)}/${encodeURIComponent(category.name)}/items/${listing.id}`
            : '#';
        if (!platform) item.classList.add('is-disabled');

        const image = document.createElement('img');
        image.src = listing.cover ? `/market/uploads/${listing.cover}` : fallbackAvatar;
        image.alt = listing.name || 'Объявление';

        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = listing.name || 'Без названия';
        const meta = document.createElement('span');
        meta.textContent = `${listing.price ?? 'Цена не указана'} ₽`;
        content.append(title, meta);
        item.append(image, content);
        container.appendChild(item);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await getPublicData();
        if (!data?.user) throw new Error('Публичный профиль не найден');

        const { user, listings = [], reviews = [], categories = [], platforms = [] } = data;
        const displayName = user.nickname || 'Пользователь PL-GL';
        const avatar = user.avatar || fallbackAvatar;

        document.title = `${displayName} — публичный профиль PL-GL`;
        setText('.profile-name', displayName);
        setText('.profile-desc', user.description || 'Пользователь биржи PL-GL');
        document.querySelectorAll('.profile-img').forEach(image => {
            image.src = avatar;
            image.alt = `Аватар ${displayName}`;
        });
        document.querySelectorAll('.premium').forEach(element => {
            element.hidden = !user.is_premium;
        });
        document.querySelectorAll('.badge-verified').forEach(element => {
            element.hidden = !user.verified;
        });

        const stats = document.querySelectorAll('.hero-stat strong');
        if (stats[0]) stats[0].textContent = Number(user.rating || 0).toFixed(1);
        if (stats[1]) stats[1].textContent = listings.length;
        if (stats[2]) stats[2].textContent = reviews.length;

        const quickValues = document.querySelectorAll('.quick-value');
        if (quickValues[0]) quickValues[0].textContent = listings.length;
        if (quickValues[1]) quickValues[1].textContent = reviews.length;

        renderReviews(reviews);
        renderListings(listings, categories, platforms);
    } catch (error) {
        console.error('Ошибка загрузки публичного профиля:', error);
        document.querySelector('.main-column')?.prepend(
            createEmptyState('fas fa-circle-exclamation', 'Профиль недоступен', 'Не удалось загрузить данные пользователя.')
        );
    }
});
