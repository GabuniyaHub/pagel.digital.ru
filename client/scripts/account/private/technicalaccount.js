document.addEventListener('DOMContentLoaded', function () {
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    menuIcon.addEventListener('click', function () {
        menuIcon.classList.toggle('active');
        navLinks.classList.toggle('active');
    });    
    
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "null");

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

    fetch('/account/get/data', { credentials: 'include' })
        .then(response => {
            if (response.status === 401) {
                window.location.href = "/pages/user-auth/login.html";
            }
        })
        .catch(() => {
            window.location.href = "/pages/user-auth/login.html";
        });

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
        if (!e.target.matches(".account-circle") && !e.target.closest(".dropdown-content")) {
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
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");

            fetch('/account/logout', { method: 'POST', credentials: 'include' })
                .finally(() => {
                    window.location.href = "/pages/index.html";
                });
        });
    }
});
