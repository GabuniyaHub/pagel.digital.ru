// <!-- Модальное окно "сообщить о нарушении" -->
function openReportModal() {
    document.getElementById("reportModal").style.display = "flex";
    // Добавляем обработчики событий при открытии модалки
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('click', handleOutsideClick);
}

function closeModal() {
    document.getElementById("reportModal").style.display = "none";
    // Удаляем обработчики при закрытии, чтобы не накапливались
    document.removeEventListener('keydown', handleEscapeKey);
    document.removeEventListener('click', handleOutsideClick);
}

// Закрытие по ESC
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
}

// Закрытие при клике вне модального окна
function handleOutsideClick(event) {
    const modal = document.getElementById("reportModal");
    if (event.target === modal) {
        closeModal();
    }
}

function sendViaEmail() {
    window.location.href = "mailto:abuse@example.com?subject=Жалоба на нарушение";
    closeModal();
}

function sendViaTelegram() {
    window.open("https://t.me/your_support_bot", "_blank");
    closeModal();
}