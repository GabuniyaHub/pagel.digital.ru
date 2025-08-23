// Обработка ссылки "Забыли пароль"
document.getElementById('forgotPasswordLink').addEventListener('click', async function (event) {
    event.preventDefault();

    // Запрос email
    const { value: email } = await Swal.fire({
        title: 'Восстановление пароля',
        input: 'email',
        inputLabel: 'Введите ваш email',
        inputPlaceholder: 'example@example.com',
        showCancelButton: true,
        confirmButtonText: 'Отправить код',
        cancelButtonText: 'Отмена',
        inputValidator: (value) => {
            if (!value) return 'Пожалуйста, введите email!';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Неверный формат email!';
        }
    });

    if (email) {
        try {
            // Включаем спиннер и отключаем кнопку
            setForgotPasswordLoadingState(true, 'Отправка...');

            // Отправка email на сервер для получения кода
            const response = await fetch('http://localhost:3000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (response.ok) {
                // Запрос кода
                const { value: code } = await Swal.fire({
                    title: 'Введите код подтверждения',
                    input: 'text',
                    inputLabel: 'Код отправлен на ваш email',
                    inputPlaceholder: '123456',
                    showCancelButton: true,
                    confirmButtonText: 'Подтвердить',
                    cancelButtonText: 'Отмена',
                    inputValidator: (value) => {
                        if (!value) return 'Пожалуйста, введите код!';
                    }
                });

                if (code) {
                    // Включаем спиннер и отключаем кнопку
                    setForgotPasswordLoadingState(true, 'Проверка кода...');

                    // Проверка кода на сервере
                    const verifyResponse = await fetch('http://localhost:3000/api/verify-reset-code', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, code })
                    });

                    const verifyResult = await verifyResponse.json();

                    if (verifyResponse.ok) {
                        // Если код верный, запрашиваем новый пароль
                        const { value: newPassword } = await Swal.fire({
                            title: 'Введите новый пароль',
                            input: 'password',
                            inputLabel: 'Новый пароль',
                            inputPlaceholder: 'Не менее 8 символов',
                            showCancelButton: true,
                            confirmButtonText: 'Сменить пароль',
                            cancelButtonText: 'Отмена',
                            inputValidator: (value) => {
                                if (!value) return 'Пожалуйста, введите новый пароль!';
                                if (!/^(?=.*[A-Za-z])[A-Za-z\d@$!%*?&\-_.]{8,}$/.test(value)) {
                                    return 'Пароль должен быть не менее 8 символов и содержать хотя бы одну букву!';
                                }
                            }
                        });

                        if (newPassword) {
                            // Отправка нового пароля на сервер
                            const resetResponse = await fetch('http://localhost:3000/api/reset-password', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ email, code, newPassword })
                            });

                            const resetResult = await resetResponse.json();

                            if (resetResponse.ok) {
                                Swal.fire("Успех", resetResult.message, "success").then(() => {
                                    window.location.href = '../../../pages/user-auth/login.html'; // Перенаправление на страницу входа
                                });
                            } else {
                                // Обработка ошибок
                                if (resetResult.message.includes("Доступ заблокирован")) {
                                    Swal.fire("Ошибка", resetResult.message, "error");
                                } else if (resetResult.message.includes("Осталось попыток")) {
                                    Swal.fire("Ошибка", resetResult.message, "error");
                                } else {
                                    Swal.fire("Ошибка", resetResult.message || "Неверный код подтверждения.", "error");
                                }
                            }
                        }
                    } else {
                        // Если код неверный, показываем ошибку
                        Swal.fire("Ошибка", verifyResult.message || "Неверный код подтверждения.", "error");
                    }
                }
            } else {
                Swal.fire("Ошибка", result.message, "error");
            }
        } catch (err) {
            Swal.fire("Ошибка", "Ошибка подключения к серверу. Попробуйте позже.", "error");
            console.error(err);
        } finally {
            // Выключаем спиннер и включаем кнопку
            setForgotPasswordLoadingState(false, 'Забыли пароль?');
        }
    }
});

// Функция для управления состоянием кнопки и спиннера
function setForgotPasswordLoadingState(isLoading, buttonText) {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink'); // Ссылка "Забыли пароль?"
    const forgotPasswordText = document.getElementById('forgotPasswordText'); // Текст ссылки
    const forgotPasswordSpinner = document.getElementById('forgotPasswordSpinner'); // Спиннер

    if (isLoading) {
        // Отключаем ссылку и показываем спиннер
        forgotPasswordLink.style.pointerEvents = 'none'; // Отключаем клики
        forgotPasswordText.textContent = buttonText; // Устанавливаем текст
        forgotPasswordSpinner.style.display = 'inline-block'; // Показываем спиннер
    } else {
        // Включаем ссылку и скрываем спиннер
        forgotPasswordLink.style.pointerEvents = 'auto'; // Включаем клики
        forgotPasswordText.textContent = buttonText; // Восстанавливаем текст
        forgotPasswordSpinner.style.display = 'none'; // Скрываем спиннер
    }
}