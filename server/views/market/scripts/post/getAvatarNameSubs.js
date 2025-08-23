// <!-- Чтобы динамически подгружать аватар, название и подписчиков -->

document.addEventListener('DOMContentLoaded', function () {
    // Получи ссылку и платформу из data-атрибутов или напрямую из listing
    const avatarImg = document.getElementById('listing-avatar');
    const titleEl = document.getElementById('listing-title');
    const subsEl = document.getElementById('listing-subscribers');

    // Пример: получаем из data-атрибутов на body или другом элементе
    const url = avatarImg.dataset.link || '<%= listing.link %>';
    const platform = avatarImg.dataset.platform || '<%= listing.platform_slug %>';

    if (!url || !platform) return;

    fetch(`/market/avatar?url=${encodeURIComponent(url)}&platform=${encodeURIComponent(platform)}`)
      .then(res => res.json())
      .then(data => {
        if (data.avatar && avatarImg) avatarImg.src = data.avatar;
        if (data.title && titleEl) titleEl.textContent = data.title;
        if (data.subscribers && subsEl) subsEl.textContent = 'Подписчиков: ' + data.subscribers;
      })
      .catch(() => {
        if (subsEl) subsEl.textContent = 'Подписчиков: —';
      });
});