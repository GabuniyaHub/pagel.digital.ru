document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('catalog-filters');
    const error = document.getElementById('filter-error');
    form.addEventListener('invalid', () => { document.querySelector('.catalog-filters').open = true; }, true);
    form.addEventListener('submit', event => {
        error.hidden = true;
        for (const prefix of ['price', 'subs', 'income']) {
            const min = form.elements[prefix + '_min'];
            const max = form.elements[prefix + '_max'];
            if (min?.value && max?.value && Number(min.value) > Number(max.value)) {
                event.preventDefault();
                error.textContent = 'Значение «от» не должно превышать «до». Проверьте диапазон.';
                error.hidden = false;
                document.querySelector('.catalog-filters').open = true;
                min.focus();
                return;
            }
        }
    });
    form.elements.sort.addEventListener('change', () => form.requestSubmit());
    const mobile = matchMedia('(max-width: 760px)');
    const updateFilters = () => document.querySelectorAll('.catalog-categories, .catalog-filters').forEach(panel => { panel.open = !mobile.matches; });
    updateFilters();
    mobile.addEventListener('change', updateFilters);
    if (!error.hidden) document.querySelector('.catalog-filters').open = true;
    let loading = false;
    document.addEventListener('click', async event => {
        const more = event.target.closest('#load-more');
        if (!more || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        if (loading) return;
        loading = true;
        more.setAttribute('aria-disabled', 'true');
        more.textContent = 'Загружаем…';
        const status = document.getElementById('pagination-status');
        try {
            if (!await window.PlglAuth.require()) return;
            const response = await fetch(more.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!response.ok) throw new Error('Не удалось загрузить объявления. Попробуйте ещё раз.');
            const fragment = new DOMParser().parseFromString(await response.text(), 'text/html');
            const grid = document.getElementById('listings-container');
            const next = fragment.getElementById('catalog-pagination');
            if (!next || !fragment.getElementById('listings-container')) throw new Error('Не удалось загрузить объявления. Обновите страницу.');
            const existing = new Set([...grid.querySelectorAll('[data-id]')].map(card => card.dataset.id));
            const cards = [...fragment.querySelectorAll('.market-card')].filter(card => !existing.has(card.dataset.id));
            grid.append(...cards);
            window.PlglMedia.hydrate(grid);
            document.getElementById('catalog-pagination').replaceWith(next);
            next.querySelector('.previous-page')?.remove();
            if (cards.length) {
                cards[0].querySelector('h2 a').focus({ preventScroll: true });
                cards[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            document.getElementById('pagination-status').textContent = 'Добавлено объявлений: ' + cards.length;
        } catch (failure) {
            status.textContent = failure.message;
            more.textContent = 'Попробовать ещё раз';
            more.removeAttribute('aria-disabled');
        } finally { loading = false; }
    });
});
