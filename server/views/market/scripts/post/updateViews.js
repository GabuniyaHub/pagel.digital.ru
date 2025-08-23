// <!-- обновление числа просмотров  -->
document.addEventListener('DOMContentLoaded', async () => {
    const listingElement = document.querySelector('[data-listing]'); // Находим элемент с data-listing

    if (listingElement) {
        const listingId = listingElement.dataset.listing;

        if (listingId) {
        try {
            const response = await fetch(`/market/items/${listingId}/view`, {
            method: 'POST',
            });
            if (!response.ok) {
            console.error('Ошибка при увеличении счетчика просмотров:', response.status);
            }
            const data = await response.json();
            const viewsCountElement = document.getElementById('views-count');

            if (viewsCountElement) {
            viewsCountElement.textContent = data.views;
            }
        } catch (error) {
            console.error('Ошибка при увеличении счетчика просмотров:', error);
        }
        } else {
        console.warn("Отсутствует listingId, platformName или catalogName");
        }
    } else {
        console.warn("Элемент с data-listing не найден.");
    }
});