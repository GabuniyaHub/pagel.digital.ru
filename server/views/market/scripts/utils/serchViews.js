const toggle = document.getElementById("search-toggle");
const menu = document.getElementById("search-menu"); // ID тот же
const container = document.getElementById("search");
const input = document.getElementById("search-input");
const results = document.getElementById("search-results");

// Открытие/закрытие меню
toggle.addEventListener("click", (e) => {
  e.preventDefault();
  container.classList.toggle("open");
  input.focus();
//   renderResults("");

  // Закрытие меню при нажатии клавиши Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      container.classList.remove("open");
    }
  });

  //Загрузка всех платформ при открытии меню
    if (container.classList.contains("open")) {
        loadPlatforms(); // Загружаем платформы при открытии меню
    }

});

// Закрытие при клике вне меню
document.addEventListener("click", (e) => {
    if (!container.contains(e.target)) {
      container.classList.remove("open");
    }
  });
  
  // Отрисовка результатов
  function renderResults(query) {
    results.innerHTML = "";
    platforms
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .forEach(p => {
        const li = document.createElement("li");
        li.textContent = p.name;
        results.appendChild(li);
      });
  }

    function renderResults(platforms) {
        results.innerHTML = ""; // Очищаем предыдущие результаты

        if (!Array.isArray(platforms)) {
            console.error("Ответ сервера не является массивом:", platforms);
            return;
        }

        if (platforms.length === 0) {
            const li = document.createElement("li");
            li.textContent = "Ничего не найдено";
            results.appendChild(li);
            return;
        }

        platforms.forEach((platform) => {
            const li = document.createElement("li");

            // Создаем элемент для иконки
            const img = document.createElement("img");
            img.src = platform.icon; // Убедитесь, что это правильный путь к изображению
            img.alt =`${platform.name} icon`; // Альтернативный текст для изображения
            img.style.width = "24px"; // Устанавливаем ширину изображения
            img.style.height = "24px"; // Устанавливаем высоту изображения
            img.style.marginRight = "8px"; // Отступ между изображением и текстом
            li.appendChild(img); // Добавляем изображение в элемент списка

            //Создаем текстовый узел для имен платформы
            const text = document.createTextNode(platform.name); // Создаем текстовый узел с именем платформы

            li.appendChild(img); // Добавляем изображение в элемент списка
            li.appendChild(text); // Добавляем текстовый узел в элемент списка

            // Добавляем обработчик события клика на элемент списка
            li.addEventListener("click", () => {
                window.location.href = `/market/${platform.slug}`; // Переход на страницу платформы
            });
            // Добавляем элемент списка в контейнер результатов
            results.appendChild(li);
        });
    }

    async function loadPlatforms(query = "") {
        try {
            // Извлекаем токен из localStorage или sessionStorage
            const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

            const userId = user?.id; // Извлекаем userId из объекта пользователя
            console.log("userId:", userId); // Логируем userId для отладки

            // Выполняем запрос к API для получения платформ
            const res = await fetch(`/market/search?q=${encodeURIComponent(query)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(userId && { "x-user-id": userId }) // Добавляем userId в заголовок, если он существует
                }
            });

            if (res.status === 403) {
                //Удаляем данные из local или session storage
                localStorage.removeItem("jwt"); // Удаляем токен из localStorage
                localStorage.removeItem("user"); // Удаляем данные пользователя из localStorage

                sessionStorage.removeItem("jwt"); // Удаляем токен из sessionStorage
                sessionStorage.removeItem("user"); // Удаляем данные пользователя из sessionStorage

                Swal.fire({
                    icon: "error",
                    title: "Ваш аккаунт заблокирован",
                    text: "Свяжитесь с plgl@gmail.com для получения дополнительной информации.",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.location.href = "/pages/user-auth/login.html"; // Перенаправление на страницу входа
                })

                return;

            }

            if (!res.ok) {
                throw new Error(`Ошибка: ${res.status}`);
            }

            // Получаем массив платформ из ответа
            const platforms = await res.json();
            console.log("Ответ от сервера", platforms); // Логируем ответ сервера для отладки 
            renderResults(platforms); // Передаём массив платформ
        } catch (error) {
            console.error("Ошибка загрузки платформ:", error);
        }
    }

    // Обработчик ввода в поле поиска
    input.addEventListener("input", (e) => {
        const query = e.target.value;
        loadPlatforms(query); // Загружаем платформы по запросу
    });

    // Загрузка платформ при загрузке страницы
    document.addEventListener("DOMContentLoaded", () => {
        loadPlatforms(); // загрузка платформ
    });