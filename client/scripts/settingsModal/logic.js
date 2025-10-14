import { fetchUserSettings, confirmAction } from "./api.js";

// Валидация Email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email && emailRegex.test(email);
}

// Валидация Пароля
function validatePassword(password) {
    return password && password.length >= 8 && /^(?=.*[A-Za-z]).*$/.test(password);
}


export function initLogic(modal) {
    const overlay = modal;
    const closeBtn = modal.querySelector(".close-btn");
    const emailSpan = modal.querySelector("#user-email");
    let currentEmail;
    const errorBox = modal.querySelector("#settings-error");

    const changePasswordBtn = modal.querySelector("#change-password-btn");
    const changeEmailBtn = modal.querySelector("#change-email-btn");
    const deleteAccountBtn = modal.querySelector("#delete-account-btn");

    // Закрытие модалки
    closeBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });


    // Получаем данные
    fetchUserSettings()
        .then(data => {
            if (data && data.email) {
                emailSpan.textContent = data.email || "Неизвестно";
                if (data.google_id) {
                    // Если пользователь вошел через Google, скрываем кнопки
                    changePasswordBtn.style.display = 'none';
                    changeEmailBtn.style.display = 'none';
                }
            } else {
                emailSpan.textContent = "Неизвестно";
            }
        })
        .catch(() => {
            emailSpan.textContent = "Ошибка загрузки";
        });

    // Универсальная функция подтверждения
    async function handleAction(action, extraData = {}) {
        errorBox.textContent = "";

        // 1. Ввод текущего пароля
        const { value: currentPassword, isDismissed } = await Swal.fire({
            title: 'Введите текущий пароль',
            input: 'password',
            inputPlaceholder: 'Ваш текущий пароль',
            showCancelButton: true,
            confirmButtonText: 'Далее'
        });
        if (isDismissed) return;

        
        // Отправляем запрос на получение кода подтверждения
        const req = await confirmAction("/settings/request-confirmation", { action, currentPassword, ...extraData });

        if (req.error) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: req.error
            });
            return;
        }

        Swal.fire({
            icon: 'success',
            title: 'Успешно!',
            text: 'Код подтверждения отправлен на вашу почту.'
        });

        // 2. Ввод кода подтверждения
        const { value: code, isDismissed: codeDismissed } = await Swal.fire({
            title: 'Введите код',
            input: 'text',
            inputPlaceholder: 'Код из письма',
            showCancelButton: true,
            confirmButtonText: 'Подтвердить'
        });
        if (codeDismissed) return;

        // 3. Условный запрос нового пароля, если действие - смена пароля
        let newPassword = null;
        if (action === 'changePassword') {
            const { value: newPass, isDismissed: newPassDismissed } = await Swal.fire({
                title: 'Введите новый пароль',
                input: 'password',
                inputPlaceholder: 'Новый пароль',
                showCancelButton: true,
                confirmButtonText: 'Подтвердить',
                preConfirm: (newPasswordInput) => {
                    if (!validatePassword(newPasswordInput)) {
                        Swal.showValidationMessage('Пароль должен быть не менее 8 символов и содержать хотя бы одну букву.');
                        return false; // Отменяет закрытие модалки
                    }
                    return newPasswordInput;
                }
            });
            if (newPassDismissed || !newPass) {
                // Если пользователь отменил или не ввел пароль
                Swal.fire({
                    icon: 'warning',
                    title: 'Отменено',
                    text: 'Смена пароля отменена.'
                });
                return;
            }
            
            newPassword = newPass;
        }

        // 4. Подтверждение действия
        const confirmPayload = {
            action,
            code,
            ...extraData
        };

        if (action === 'changePassword') {
            confirmPayload.newPassword = newPassword;
        }

        const confirm = await confirmAction("/settings/confirm", confirmPayload);

        if (confirm.error) {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: confirm.error
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Успешно!',
                text: confirm.message || "Действие выполнено успешно"
            }).then(() => {
                if (action === "changeEmail" && extraData.newEmail) {
                    emailSpan.textContent = extraData.newEmail;
                }
                if (action === "deleteAccount") {
                    window.location.href = "/";
                }
            });
        }
    }

    // Обработчики событий для кнопок
    changePasswordBtn.addEventListener("click", () => handleAction("changePassword"));

    changeEmailBtn.addEventListener("click", async () => {
        const { value: newEmail, isDismissed } = await Swal.fire({
            title: 'Введите новый email',
            input: 'text',
            inputPlaceholder: 'Новый email',
            showCancelButton: true,
            confirmButtonText: 'Далее',
            preConfirm: (newEmailInput) => {
                if (!validateEmail(newEmailInput)) {
                    Swal.showValidationMessage('Неверный формат email.');
                    return false; // Отменяет закрытие модалки
                }
                return newEmailInput;
            }
        });
        if (isDismissed || !newEmail) return;
        
        await handleAction("changeEmail", { newEmail });
    });

    deleteAccountBtn.addEventListener("click", async () => {
        const result = await Swal.fire({
            title: 'Вы уверены?',
            text: "Это действие необратимо!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Да, удалить аккаунт'
        });

        if (result.isConfirmed) {
            await handleAction("deleteAccount");
        }
    });
}