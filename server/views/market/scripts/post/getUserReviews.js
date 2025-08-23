async function fetchReviewCounts(userId) {
  try {
    const response = await fetch(`/market/get/user/reviews/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const reviewCounts = await response.json();
    return reviewCounts;
  } catch (error) {
    console.error('Ошибка при получении статистики отзывов:', error);
    return { positive_count: 0, neutral_count: 0, negative_count: 0 }; // Возвращаем нули в случае ошибки
  }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userNameContainer = document.querySelector('.body-header-user-name-container');
    if (userNameContainer) { 
        const userId = userNameContainer.dataset.userId;
        if(userId){
            const reviewCounts = await fetchReviewCounts(userId);

            // Обновляем элементы на странице
            const positiveCountElement = document.getElementById('positive-count');
            const neutralCountElement = document.getElementById('neutral-count');
            const negativeCountElement = document.getElementById('negative-count');

            if (positiveCountElement) {
                positiveCountElement.textContent = `${reviewCounts.positive_count}`;
            }

            if (neutralCountElement) {
                neutralCountElement.textContent = `${reviewCounts.neutral_count}`;
            }

            if (negativeCountElement) {
                negativeCountElement.textContent = `${reviewCounts.negative_count}`;
            }

        }
    }
});