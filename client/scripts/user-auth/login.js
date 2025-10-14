document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const emailInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox.checked;

    // Валидация на клиенте
    if (email === '') {
        Swal.fire("Ошибка", "Пожалуйста, введите email.", "error");
        emailInput.focus();
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire("Ошибка", "Неверный формат email.", "error");
        emailInput.focus();
        return;
    }

    if (!/^(?=.*[A-Za-z])[A-Za-z\d@$!%*?&\-_.]{8,}$/.test(password)) {
        Swal.fire("Ошибка", "Пароль должен быть не менее 8 символов, содержать хотя бы одну букву и использовать латинские буквы.", "error");
        passwordInput.focus();
        return;
    }

    try {
        // Включаем спиннер и отключаем кнопку
        setLoadingState(true);

        // Отправка данных на сервер
        const response = await fetch('https://www.pagel-digital.ru/api/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, rememberMe })
        });

        const result = await response.json();
        console.log(result);

        if (response.ok) {
            if (result.requiresConfirmation) {
                // Если требуется подтверждение email, показываем модальное окно для ввода кода
                const { value: confirmationCode } = await Swal.fire({
                    title: 'Подтверждение email',
                    input: 'text',
                    inputLabel: 'Введите код, отправленный на вашу почту',
                    inputPlaceholder: 'Код подтверждения',
                    showCancelButton: true,
                    confirmButtonText: 'Подтвердить',
                    cancelButtonText: 'Отмена',
                    inputValidator: (value) => {
                        if (!value) return 'Пожалуйста, введите код подтверждения!';
                    }
                });

                if (confirmationCode) {
                    // Включаем спиннер и отключаем кнопку
                    setLoadingState(true);

                    // Отправка кода подтверждения на сервер
                    const confirmationResponse = await fetch('https://www.pagel-digital.ru/api/verify-code-login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, code: confirmationCode })
                    });

                    const confirmationResult = await confirmationResponse.json();

                    if (confirmationResponse.ok) {

                        const user = {
                            id: confirmationResult.userId,
                            name: confirmationResult.name,
                            email: confirmationResult.email
                        };

                        const token = confirmationResult.token

                        // console.log(token);

                        // Если код подтвержден, повторяем запрос на вход
                        const loginResponse = await fetch('https://www.pagel-digital.ru/api/log', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ email, password, rememberMe })
                        });

                        const loginResult = await loginResponse.json();

                        if (loginResponse.ok) {

                            loginUser(token, user, rememberMe);

                            console.log(token, user, rememberMe);

                            Swal.fire({
                                title: "Успешный вход!",
                                text: "Вы будете перенаправлены...",
                                icon: "success",
                                timer: 2000,
                                showConfirmButton: false
                            });
                            window.location.href = '../../pages/index.html';
                        } else {
                            Swal.fire("Ошибка", loginResult.message, "error");
                        }
                    } else {
                        // Обработка ошибок при вводе кода
                        if (confirmationResult.message.includes("Доступ заблокирован")) {
                            Swal.fire("Ошибка", confirmationResult.message, "error");
                        } else if (confirmationResult.message.includes("Осталось попыток")) {
                            Swal.fire("Ошибка", confirmationResult.message, "error");
                        } else {
                            Swal.fire("Ошибка", confirmationResult.message || "Неверный код подтверждения.", "error");
                        }
                    }
                }
            } else {
                // Если подтверждение не требуется, сохраняем токен и данные пользователя
                const user = {
                    id: result.userId,
                    name: result.name,
                    email: result.email
                };

                loginUser(result.token, user, rememberMe);

                Swal.fire({
                    title: "Успешный вход!",
                    text: "Вы будете перенаправлены...",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
                window.location.href = '../../pages/index.html';
            }
        } else {
            // Обработка ошибок при входе
            if (result.message.includes("Доступ заблокирован")) {
                Swal.fire("Ошибка", result.message, "error");
            } else {
                Swal.fire("Ошибка входа", result.message, "error");
            }
        }
    } catch (err) {
        Swal.fire("Ошибка", "Ошибка подключения к серверу. Попробуйте позже.", "error");
        console.error(err);
    } finally {
        // Выключаем спиннер и включаем кнопку
        setLoadingState(false);
    }
});

// Функция для входа
function loginUser(token, user, rememberMe) {
    if (rememberMe) {
        localStorage.setItem("jwt", token);
        localStorage.setItem("user", JSON.stringify(user));
        document.cookie = `jwt=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 30}`;
    } else {
        sessionStorage.setItem("jwt", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        document.cookie = `jwt=${token}; path=/; SameSite=Lax`;
    }
    location.reload();
}



// Отображение/скрытие пароля
document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordInput = document.getElementById('passwordInput');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Меняем иконку (опционально)
    this.classList.toggle('bxs-lock-alt');
    this.classList.toggle('bxs-lock-open-alt');
});

const menuIcon = document.getElementById('menu-icon');
const navLinks = document.getElementById('nav-links');

menuIcon.addEventListener('click', function () {
    menuIcon.classList.toggle('active');
    navLinks.classList.toggle('active');
});

// Функция для отключения кнопки и показа спиннера
function setLoadingState(isLoading) {
    const loginButton = document.getElementById('loginButton');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');

    if (isLoading) {
        loginButton.disabled = true; // Отключаем кнопку
        loginButtonText.textContent = 'Отправка...'; // Меняем текст
        loginSpinner.style.display = 'inline-block'; // Показываем спиннер
    } else {
        loginButton.disabled = false; // Включаем кнопку
        loginButtonText.textContent = 'Войти'; // Возвращаем текст
        loginSpinner.style.display = 'none'; // Скрываем спиннер
    }
}
