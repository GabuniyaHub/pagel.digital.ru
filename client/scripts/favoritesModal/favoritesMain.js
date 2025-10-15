import { injectFavoritesStyles } from "./favoritesStyles.js";
import { createFavoritesModal } from "./favoritesHtml.js";
import { getFavorites, removeFavorite } from "./favoritesApi.js";
import { initFavoritesLogic } from "./favoritesLogic.js";

document.addEventListener("DOMContentLoaded", () => {
  const favoritesBtn = document.querySelector(".select-favorites");

  if (favoritesBtn) {
    // 1. Подключаем стили
    injectFavoritesStyles();

    // 2. Создаём HTML модалки один раз при загрузке страницы
    const { overlay, listContainer, closeBtn } = createFavoritesModal();
    document.body.appendChild(overlay);

    // 3. Инициализируем логику (с событиями и API) один раз
    initFavoritesLogic({ overlay, listContainer, closeBtn, getFavorites, removeFavorite });

    // 4. Обработчик клика теперь только показывает/скрывает модалку
    favoritesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Убираем класс hidden, чтобы показать модалку
      overlay.classList.remove("hidden");
    });
  }
});

console.log("Favorites module initialized ✅");