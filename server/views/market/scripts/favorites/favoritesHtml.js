export function createFavoritesModal() {
  const overlay = document.createElement("div");
  overlay.id = "favorites-overlay";
  overlay.className = "favorites-overlay hidden";
  

  overlay.innerHTML = `
    <div class="favorites-modal">
      <span class="close-btn">&times;</span>
      <h2>Избранное</h2>
      <div id="favorites-list" class="favorites-list">
        <p>Загрузка...</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  return {
    overlay,
    listContainer: overlay.querySelector("#favorites-list"),
    closeBtn: overlay.querySelector(".close-btn"),
  };
}

