document.addEventListener('DOMContentLoaded', function () {
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    menuIcon?.addEventListener('click', function () {
        menuIcon.classList.toggle('active');
        navLinks.classList.toggle('active');
        menuIcon.setAttribute('aria-expanded', String(navLinks.classList.contains('active')));
    });    
    
    //JS для service 
    const servicesToggle = document.getElementById("toggle-services");
    if (servicesToggle) {
        servicesToggle.addEventListener("click", function () {
            const servicesContent = document.querySelector(".services-content");
            servicesContent.classList.toggle("hidden");

            // Анимация поворота кнопки
            this.classList.toggle("rotated");
        });
    }

    //JS для all-platforms
    document.getElementById("toggle-all-platforms")?.addEventListener("click", function () {
        const allPlatformsContent = document.querySelector(".all-platforms-content");
        allPlatformsContent.classList.toggle("hidden");
    
        // Анимация поворота кнопки
        this.classList.toggle("rotated");
    });

    //JS для technical-section
    document.getElementById("toggle-technical-section")?.addEventListener("click", function() {
        const technicalSectionContent = document.querySelector(".technical-section-content");
        technicalSectionContent.classList.toggle("hidden");

        //Анамация поворота кнопки
        this.classList.toggle("rotated");
    });



   // 🔹 LOCALSTORAGE + SESSIONSTORAGE
   const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt"); // Проверяем токен в обоих хранилищах
   const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user")); // Данные пользователя

    if (token && user) { // Если есть токен и пользователь
        // Скрываем "Вход" и "Регистрация"
        document.getElementById("login-item").style.display = "none";
        document.getElementById("register-item").style.display = "none";

        const registerButton = document.getElementById("register-button");
        if (registerButton) {
            registerButton.style.display = "none"; // Скрываем кнопку регистрации
        }

        // Показываем "Аккаунт" и "Продать"
        document.getElementById("account-item").style.display = "block";
        document.getElementById("sell-item").style.display = "block";

        // Устанавливаем аватар (если есть)
        // const avatarUrl = user.avatar || "https://via.placeholder.com/40";
        // document.getElementById("account-avatar").src = avatarUrl;
    } else {
        // Если пользователь не вошел, скрываем "Аккаунт" и "Продать"
        document.getElementById("account-item").style.display = "none";
        document.getElementById("sell-item").style.display = "none";
    } 


    //Обработчик показа скрытия меню навигационной панели:
    const accountCircle = document.querySelector(".account-circle");
    const dropdownContent = document.querySelector(".dropdown-content");
    // Показ/скрытие меню при клике на иконку
    accountCircle.addEventListener("click", function (e) {
        e.preventDefault(); // Предотвращаем переход по ссылке
        dropdownContent.classList.toggle("show");
    });

    // Закрытие меню при клике вне его области
    window.addEventListener("click", function (e) {
        if (!accountCircle.contains(e.target) && !dropdownContent.contains(e.target)) {
            if (dropdownContent.classList.contains("show")) {
                dropdownContent.classList.remove("show");
            }
        }
    });

    // 🔹 Обработчик для кнопки "Выход"
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", function (e) {
            e.preventDefault();
            localStorage.removeItem("jwt"); // Удаляем токен из localStorage
            localStorage.removeItem("user");

            sessionStorage.removeItem("jwt"); // Удаляем токен из sessionStorage
            sessionStorage.removeItem("user");

            document.cookie = "jwt=; Max-Age=0; path=/"; // Удаляем токен их cookies

            window.location.href = "/pages/index.html"; // Перенаправление на главную страницу
        });
    }
});
