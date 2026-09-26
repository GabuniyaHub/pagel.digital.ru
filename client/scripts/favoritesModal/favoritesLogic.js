export function initFavoritesLogic({ overlay, listContainer, closeBtn, getFavorites, removeFavorite }) {
    let opener;
    let previousOverflow;
    let generation = 0;
    let favorites = [];
    const empty = text => {
        const el = document.createElement('div');
        el.className = 'favorites-state';
        el.textContent = text;
        listContainer.replaceChildren(el);
    };
    const render = () => {
        listContainer.replaceChildren();
        document.querySelectorAll('[data-favorites-count]').forEach(el => { el.textContent = favorites.length; });
        if (!favorites.length) { empty('Пока здесь пусто. Нажмите на сердечко у понравившегося объявления, чтобы сохранить его.'); return; }
        favorites.forEach(fav => {
            const item = document.createElement('article');
            item.className = 'favorite-item';
            const img = document.createElement('img');
            img.src = window.PlglMedia.coverUrl(fav.cover, window.PlglMedia.avatarUrl(fav.seller_avatar));
            if (Number(fav.form_type) === 1) img.dataset.channelId = fav.listing_id;
            img.alt = '';
            img.addEventListener('error', () => { img.src = '/assets/images/pl-gl-default-avatar.svg'; }, { once: true });
            const detail = document.createElement('div');
            detail.className = 'favorite-detail';
            const title = document.createElement('strong');
            title.textContent = fav.name || 'Объявление';
            const meta = document.createElement('p');
            meta.textContent = fav.platform_name || 'YouTube';
            if (Number(fav.form_type) === 1) {
                const count = document.createElement('span');
                count.dataset.subscribersId = fav.listing_id;
                count.textContent = Number(fav.subscribers || 0).toLocaleString('ru-RU');
                meta.append(' · ', count, ' подписчиков');
            }
            const price = document.createElement('strong');
            price.textContent = fav.price != null ? fav.price + ' $' : 'Цена не указана';
            detail.append(title, meta, price);
            const actions = document.createElement('div');
            actions.className = 'favorite-actions';
            const link = document.createElement('a');
            link.href = '/market/' + [fav.platform_slug, fav.category_name, 'items', fav.listing_id].map(encodeURIComponent).join('/');
            link.textContent = 'Открыть';
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Убрать';
            remove.addEventListener('click', async () => {
                remove.disabled = true;
                try {
                    await removeFavorite(fav.listing_id);
                    document.dispatchEvent(new CustomEvent('plgl-favorite-removed', { detail: fav.listing_id }));
                    favorites = favorites.filter(item => String(item.listing_id) !== String(fav.listing_id));
                    render();
                    closeBtn.focus();
                } catch (error) {
                    remove.disabled = false;
                    const message = document.createElement('p');
                    message.setAttribute('role', 'alert');
                    message.textContent = error.message;
                    detail.append(message);
                }
            });
            actions.append(link, remove);
            item.append(img, detail, actions);
            listContainer.append(item);
        });
        window.PlglMedia.hydrate(listContainer);
    };
    async function load() {
        const current = ++generation;
        empty('Загружаем избранное…');
        try {
            const data = await getFavorites();
            if (current !== generation) return;
            favorites = Array.isArray(data.favorites) ? data.favorites : [];
            render();
        } catch (error) {
            if (current !== generation) return;
            empty(error.message);
            const retry = document.createElement('button');
            retry.className = 'favorites-retry';
            retry.textContent = 'Повторить';
            retry.addEventListener('click', load);
            listContainer.append(retry);
        }
    }
    const close = () => {
        overlay.hidden = true;
        generation++;
        document.body.style.overflow = previousOverflow;
        const focusTarget = opener?.getClientRects().length ? opener : document.getElementById('profile-menu-toggle');
        focusTarget?.focus();
    };
    document.addEventListener('click', event => {
        const trigger = event.target.closest('.select-favorites');
        if (!trigger) return;
        event.preventDefault();
        opener = trigger;
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        overlay.hidden = false;
        closeBtn.focus();
        load();
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
    overlay.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); }
        if (event.key === 'Tab') {
            const nodes = [...overlay.querySelectorAll('a[href],button:not(:disabled)')];
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
}
