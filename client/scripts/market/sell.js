document.addEventListener("DOMContentLoaded", function () {
    
    // 🔹 LOCALSTORAGE + SESSIONSTORAGE
    const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

    if (jwt && user) {
        // Скрываем "Вход" и "Регистрация"
        document.getElementById("login-item").style.display = "none";
        document.getElementById("register-item").style.display = "none";

        const registerButton = document.getElementById("register-button");
        if (registerButton) {
            registerButton.style.display = "none"; // Скрываем кнопку регистрации
        }

        // Показываем "Аккаунт" и "Продать"
        document.getElementById("account-item").style.display = "block";

        // Устанавливаем аватар (если есть)
        // const avatarUrl = user.avatar || "https://via.placeholder.com/40";
        // document.getElementById("account-avatar").src = avatarUrl;
    } else {
        // Если пользователь не вошел, скрываем "Аккаунт" и "Продать"
        document.getElementById("account-item").style.display = "none";
        document.getElementById("sell-item").style.display = "none";
        document.getElementById("login-item").style.display = "block";
        document.getElementById("register-item").style.display = "block";
        window.location.href = "/pages/user-auth/login.html"; // Перенаправляем на главную страницу
    }

    // Обработчик показа скрытия меню навигационной панели:
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.getElementById('nav-links');

    menuIcon.addEventListener('click', function () {
        menuIcon.classList.toggle('active');
        navLinks.classList.toggle('active');
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
            localStorage.removeItem("jwt"); // Удаляем токен из localStorage
            localStorage.removeItem("user");

            sessionStorage.removeItem("jwt"); // Удаляем токен из sessionStorage
            sessionStorage.removeItem("user");

            document.cookie = "jwt=; Max-Age=0; path=/"; // Удаляем токен их cookies

            window.location.href = "/pages/index.html"; // Перенаправление на главную страницу
        });
    }
    // 🔹 Проверка токена"
    async function verifyToken () {   
        const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
        
        if (!jwt) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка!',
                text: 'Токен не найден. Пожалуйста, войдите в систему.',
                confirmButtonText: 'ОК'
            }).then(() => {
                window.location.href = "/pages/user-auth/login.html"; // Перенаправляем на страницу входа
            });
            return;
        }

        const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user"));

        const userId = user?.id; // Извлекаем userId из объекта пользователя

        // Проверяем токен на сервере
        try {
            // console.log("JWT перед отправкой:", jwt);
            const response = await fetch("/market/verify-token", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                    ...(userId && { "x-user-id": userId }), // Добавляем userId в заголовок, если он существует
                },
            });

            if (response.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка!',
                    text: 'Токен недействителен или истек. Пожалуйста, войдите в систему. Перенаправляем на страницу входа...',
                    confirmButtonText: 'ОК'
                }).then(() => {
                    window.location.href = "/pages/user-auth/login.html"; // Перенаправляем на страницу входа
                });
                return;
            }

            // Проверяем блокировку пользователя
            if (response.status === 403) {
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
                });
                // .then(() => {
                //     setTimeout(() => {
                //         window.location.href = "/pages/user-auth/login.html"; // Перенаправление на страницу входа
                //     }, 3000); // Задержка в миллисекундах (здесь 3000 = 3 секунды)
                // })

                return;

            }

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Ошибка проверки токена!',
                    text: `Код ошибки: ${response.status}. Перенаправляем главную страницу...`,
                    confirmButtonText: 'ОК'
                }).then(() => {
                    window.location.href = "/pages/index.html"; // Перенаправляем на главную страницу
                });
                return;
            }

            const data = await response.json();
            if (data.blocked) {
                Swal.fire({
                    icon: "error",
                    title: "Пользователь заблокирован",
                    text: "Ваш аккаунт заблокирован. Перенаправление на страницу входа...",
                }).then(() => {
                    window.location.href = "/pages/user-auth/login.html"; // Перенаправляем на страницу входа
                });
                return;
            }

            // Swal.fire({
            //     icon: "success",
            //     title: "Успех",
            //     text: "Токен и блокировка проверены корректно!",
            //     timer: 1500,
            //     showConfirmButton: false,
            // })
            // console.log("Проверка токена прошла успешно:", data);
        } catch (error) {
             Swal.fire({
                icon: "error",
                title: "Ошибка",
                text: `Ошибка при загрузке страницы: ${error.message}`,
            });
        }
    }

    verifyToken();

    
});