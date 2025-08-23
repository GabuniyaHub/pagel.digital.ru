document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.listing-card').forEach(async card => {
        const url = card.dataset.link;
        const platform = card.dataset.platform;
        const id = card.dataset.id;
        const img = document.getElementById(`avatar-${id}`);

        // 1. Если есть загруженный пользователем аватар
        if (img && img.dataset.cover) {
            img.src = img.dataset.cover;
            // Всё равно парсим title и подписчиков, если есть ссылка
            if (!url || url === 'Ссылка отсуствует') return;
        }

        // 2. Если есть ссылка — парсим
        if (url && url !== 'Ссылка отсуствует' && platform && id) {
            try {
                const res = await fetch(`/market/avatar?url=${encodeURIComponent(url)}&platform=${encodeURIComponent(platform)}`);
                if (!res.ok) throw new Error(`Ошибка сети: ${res.status} ${res.statusText}`);
                const data = await res.json();
                // console.log(`Получены данные для ${platform} (${id}):`, data);

                // if (data.theme) {
                //     // Устанавливаем тему, если она есть
                //     console.log(data.theme);
                //     // document.documentElement.setAttribute('data-theme', data.theme);
                // } else {
                //     console.error('тема не найдена в ответе:', data);
                // }

                // Не меняем аватар, если есть cover
                if (!img.dataset.cover && data.avatar) {
                    img.src = data.avatar;
                }
                if (data.title) {
                    const titleEl = document.getElementById(`title-${id}`);
                    if (titleEl) titleEl.textContent = data.title;
                }



                if (data.subscribers !== undefined) {
                    const subsEl = document.getElementById(`subs-${id}`);
                    const count = Number(data.subscribers);

                    if (subsEl) {
                        if (!isNaN(count) && count > 0) {
                            subsEl.style.display = 'block';
                            subsEl.innerHTML = `Подписчики: <b>${count}</b>`;
                        } else {
                            // Если парсер ничего не дал или 0 — оставить изначальное значение из базы
                            // Но можно скрыть:
                            subsEl.style.display = 'none';
                            subsEl.innerHTML = '';
                        }
                    }

                    // Обновляем data-subs
                    const subsDataEl = document.querySelector(`.listing-card[data-id="${id}"]`);
                    if (subsDataEl) {
                        subsDataEl.dataset.subs = count;
                    } else {
                        console.warn(`Карточка с data-id="${id}" не найдена`);
                    }
                }

            } catch (err) {
                console.error(`Ошибка при загрузке аватара для ${platform} (${id}):`, err);
                if (img && !img.dataset.cover) {
                    img.src = '/market/assets/item/default2.png';
                    img.alt = 'Аватар не найден';
                }
            }
        }
        // 3. Если нет ни cover, ни ссылки — дефолтная картинка уже стоит по умолчанию
    });
});