export function createFavoritesModal() {
    const overlay = document.createElement('div');
    overlay.id = 'favorites-overlay';
    overlay.className = 'favorites-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="favorites-modal" role="dialog" aria-modal="true" aria-labelledby="favorites-title">
        <header class="favorites-heading"><div><h2 id="favorites-title">Избранное</h2><p>Сохранённые объявления — всё под рукой</p></div>
          <button type="button" class="favorites-close" aria-label="Закрыть избранное">×</button>
        </header>
        <div class="favorites-list" aria-live="polite"></div>
      </section>`;
    return { overlay, listContainer: overlay.querySelector('.favorites-list'), closeBtn: overlay.querySelector('.favorites-close') };
}
