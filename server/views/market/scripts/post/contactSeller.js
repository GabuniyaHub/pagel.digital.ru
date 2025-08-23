// <!-- Модальное окно "связаться с продавцом" -->
// Открытие модального окна
function openContactModal() {
    const modal = document.getElementById("contactModal");
    modal.style.display = "flex";

    // Обработчик нажатия ESC
    document.addEventListener("keydown", escHandler);
    
    }

    // Закрытие модального окна
    function closeModalContact() {
        const modal = document.getElementById("contactModal");
        modal.style.display = "none";

        // Удаляем обработчик ESC при закрытии
        document.removeEventListener("keydown", escHandler);
    }

    // Обработка нажатия ESC
    function escHandler(e) {
        if (e.key === "Escape") {
            closeModalContact();
        }
    }

    // Обработка открытия ссылки
    function openLink(url) {
        window.open(url, "_blank");
        closeModalContact();
    }

    // Закрытие по клику вне контента (на фон)
    document.addEventListener("click", function (e) {
    const modal = document.getElementById("contactModal");
    if (!modal || modal.style.display !== "flex") return;

    // если клик был по самой подложке, а не по содержимому
    if (e.target === modal) {
        closeModalContact();
    }
});