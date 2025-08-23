// <!-- Открытие скриншотов -->
  // Получаем все элементы с классом "screenshot-image"
const screenshotImages = document.querySelectorAll('.screenshot-image');

// Получаем модальное окно и изображение в нем
const modal = document.getElementById('screenshotModal');
const modalImage = document.getElementById('modalImage');

// Получаем кнопку закрытия
const closeBtn = document.querySelector('.close');

// Добавляем обработчик клика для каждого изображения
screenshotImages.forEach(img => {
    img.addEventListener('click', () => {
        modal.style.display = "block"; // Открываем модальное окно
        modalImage.src = img.dataset.imageUrl; // Устанавливаем URL изображения из data-атрибута
    });
});

// Добавляем обработчик клика для кнопки закрытия
closeBtn.addEventListener('click', () => {
    modal.style.display = "none"; // Закрываем модальное окно
});

// Закрываем модальное окно при клике вне изображения
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
});