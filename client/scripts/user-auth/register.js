document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    const termsCheckbox = document.getElementById('termsCheckbox');

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        // Проверка, отмечен ли чекбокс "Принять условия"
        if (!termsCheckbox.checked) {
            const result = await Swal.fire({
                title: "Внимание",
                text: "Пожалуйста, примите условия использования.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Принять",
                cancelButtonText: "Отмена"
            });

            if (!result.isConfirmed) return;
            termsCheckbox.checked = true;
        }

        const nameInput = document.getElementById('nicknameInput');
        const emailInput = document.getElementById('emailInput');
        const passwordInput = document.getElementById('newPasswordInput');
        const repeatPasswordInput = document.getElementById('confirmPasswordInput');

        // Проверка на пустые поля
        if (!nameInput.value.trim() || !emailInput.value.trim() || !passwordInput.value.trim() || !repeatPasswordInput.value.trim()) {
            Swal.fire("Ошибка", "Все поля должны быть заполнены.", "error");
            return;
        }

        // Проверка формата никнейма
        const namePattern = /^[a-zA-Z0-9_-]+$/;
        if (!namePattern.test(nameInput.value.trim())) {
            Swal.fire("Ошибка", "Никнейм должен содержать только латиницу, цифры, подчеркивания и дефисы.", "error");
            return;
        }

        // Проверка формата email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailInput.value.trim())) {
            Swal.fire("Ошибка", "Введите корректный email.", "error");
            return;
        }

        // Проверка сложности пароля
        const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d-]{8,}$/;
        if (!passwordPattern.test(passwordInput.value.trim())) {
            Swal.fire("Ошибка", "Пароль должен содержать минимум 8 символов, включая хотя бы одну букву и одну цифру.", "error");
            return;
        }

        // Проверка совпадения паролей
        if (passwordInput.value !== repeatPasswordInput.value) {
            Swal.fire("Ошибка", "Пароли должны совпадать.", "error");
            return;
        }

        const email = emailInput.value.trim();

        // Проверка уникальности email
        const checkEmailResponse = await fetch("/api/check-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const checkEmailResult = await checkEmailResponse.json();
        if (!checkEmailResult.success) {
            Swal.fire("Ошибка", checkEmailResult.message, "error");
            return;
        }

        const loadingSpinner = document.getElementById('loadingSpinner');
        const sendCodeButton = document.getElementById('registerButton');
        
        if (!loadingSpinner || !sendCodeButton) {
            console.error('Элементы не найдены!');
            return;
        }
        
        // Показываем спиннер
        loadingSpinner.style.display = 'block';
        
        // Отключаем кнопку зарегистрироваться на время отправки кода
        sendCodeButton.disabled = true;
        
        // Запрос на отправку кода
        const sendCodeResponse = await fetch("/api/send-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });
        
        const sendCodeResult = await sendCodeResponse.json();
        if (!sendCodeResult.success) {
            Swal.fire("Ошибка", sendCodeResult.message, "error");
            return;
        }
        
        // Скрываем спиннер
        loadingSpinner.style.display = 'none';
        
        // Включаем кнопку зарегистрироваться
        sendCodeButton.disabled = false;
        
        // Показываем модальное окно для ввода кода
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
        
        if (!confirmationCode) return; // Если пользователь нажал "Отмена"

        // Проверка кода
        const verifyResponse = await fetch("/api/verify-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: confirmationCode })
        });

        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
            Swal.fire("Ошибка", "Неверный код, попробуйте снова.", "error");
            return;
        }

        // Если код верный, отправляем данные на регистрацию
        const data = {
            name: nameInput.value.trim(),
            email: email,
            password: passwordInput.value.trim(),
        };

        try {
            const response = await fetch('/api/reg', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('user', result.userId);
                localStorage.setItem('jwt', result.token);
                document.cookie = `jwt=${token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 30}`;

                Swal.fire({
                    title: "Успешная регистрация!",
                    text: "Вы будете перенаправлены...",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });

                window.location.href = '../../pages/index.html';
            } else {
                Swal.fire("Ошибка", result.message, "error");
            }
        } catch (err) {
            console.error('Ошибка при отправке формы:', err);
            Swal.fire("Ошибка", "Произошла ошибка. Попробуйте позже.", "error");
        }
    });


    // Функция для переключения видимости пароля
    function togglePasswordVisibility(inputId, toggleIconId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleIconId);

        toggleIcon.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Меняем иконку
            this.classList.toggle('bxs-lock-alt');
            this.classList.toggle('bxs-lock-open-alt');
        });
    }

    // Применяем функцию к полям пароля
    togglePasswordVisibility('newPasswordInput', 'toggleNewPassword');
    togglePasswordVisibility('confirmPasswordInput', 'toggleConfirmPassword');
});