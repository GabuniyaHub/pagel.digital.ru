export function initFavoritesLogic({ overlay, listContainer, closeBtn, getFavorites, removeFavorite }) {
  document.querySelector(".select-favorites").addEventListener("click", async (e) => {
    e.preventDefault();
    overlay.classList.remove("hidden");

    listContainer.innerHTML = "<p>Загрузка...</p>";
    const data = await getFavorites();

    if (!data.favorites?.length) {
      listContainer.innerHTML = "<p>Нет избранных товаров</p>";
      return;
    }

    const items = await Promise.all(data.favorites.map(async (fav) => {
      let parsingData = null;

      if (fav.link) {
        try {
          const res = await fetch(`/market/avatar?url=${encodeURIComponent(fav.link)}&platform=${encodeURIComponent(fav.platform_slug)}`);
          if (res.ok) {
            parsingData = await res.json();
          }
        } catch (err) {
          console.error("Ошибка получения avatar:", err);
        }
      }

      const themeMap = {
        1: "Авто",
        2: "Бизнес",
        3: "Дизайн",
        4: "Животные",
        5: "ЖЦА 30+",
        6: "Здоровье",
        7: "Знакомство и общение",
        8: "Игры",
        9: "IT",
        10: "Культура",
        11: "Кино",
        12: "Кулинария",
        13: "Литература",
        14: "Мода и красота",
        15: "Молодежные до 18",
        16: "МЦА 30+",
        17: "Наука и факты",
        18: "Недвижимость",
        19: "Новости и сми",
        20: "Образование",
        21: "Объявления",
        22: "Политика",
        23: "Природа",
        24: "Психология",
        25: "Развлечения",
        26: "Регион. порталы",
        27: "Религия",
        28: "Ремонт",
        29: "Работа",
        30: "Семья",
        31: "Спорт",
        32: "Товары и услуги",
        33: "Туризм",
        34: "Фото",
        35: "Хобби",
        36: "Эзотерика",
        37: "Эротика",
        38: "Юмор",
        39: "Другое",
        40: "Фан группы",
        41: "Крипта/NFT"
    };

      const subscribers = fav.subscribers
        ? `👥 ${fav.subscribers} подписчиков`
        : parsingData?.subscribers
        ? `👥 ${parsingData.subscribers} подписчиков`
        : "";

      const avatar = fav.cover 
        ? `/market/uploads/${fav.cover}`
        : parsingData?.avatar || "/img/no-image.png";


      return `
        <div class="favorite-item">
            <img src="${avatar}" alt="ava" class="ad-avatar">
            <div class="ad-info">
            <strong>${fav.name || parsingData?.title || "Без названия"}</strong>
            <div>${fav.platform_name}</div>
            <div>${fav.theme && themeMap[fav.theme] ? `Тема: ${themeMap[fav.theme]}` : ''}</div>
            <span>${subscribers}</span>
            <div>
                <span>${fav.price ? fav.price + " $" : "Цена не указана"}</span>
                <span>👁 ${fav.views || 0}</span>
            </div>
            </div>
            <div class="ad-actions">
                <a href="/market/${fav.platform_slug}/${fav.category_name}/items/${fav.listing_id}" class="go-to-listing-btn">Перейти</a>
                <button class="remove-favorite" data-id="${fav.listing_id}">Удалить</button>
            </div>
        </div>
        `;
    }));

    listContainer.innerHTML = items.join("");
  });

  // Закрытие
  closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.classList.add("hidden");
  });

  // Удаление
  listContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("remove-favorite")) {
        const id = e.target.dataset.id;
        
        // Show SweetAlert2 confirmation dialog
        const result = await Swal.fire({
        title: 'Вы уверены?',
        text: "Вы не сможете отменить это!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Да, удалить!',
        customClass: {
            popup: 'my-swal-popup'
        },
        zIndex: 11
        });
        
        // Check if the user confirmed the action
        if (result.isConfirmed) {
        // Call the API function to remove the item
        await removeFavorite(id);
        
        // Remove the item from the DOM
        e.target.closest(".favorite-item").remove();
        
        // Show a success message
        Swal.fire(
            'Удалено!',
            'Товар был удален из избранного.',
            'success'
        );
        }
    }
  });
}
