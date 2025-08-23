// <!-- для обновления времени -->
function timeAgo(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return 'только что';
    } else if (minutes < 60) {
        return `${minutes} минут${minutes === 1 ? 'а' : ''} назад`;
    } else if (hours < 24) {
        return `${hours} час${hours === 1 ? 'а' : 'ов'} назад`;
    } else if (days < 30) {
        return `${days} ${days === 1 ? 'день' : 'дней'} назад`;
        // return `${days} дн${days === 1 ? 'ь' : 'ей'} назад`;
    } else if (months < 12) {
        return `${months} месяц${months === 1 ? 'а' : 'ев'} назад`;
    } else {
        return `${years} год${years === 1 ? '' : 'а'} назад`;
    }
    }

    document.addEventListener('DOMContentLoaded', () => {
    const createdAtElement = document.getElementById('created-at-placeholder');
    const createdAt = createdAtElement.dataset.createdAt;

    function updateCreatedAt() {
        createdAtElement.textContent = `Создано: ${timeAgo(new Date(createdAt))}`;
    }

    // Обновляем время сразу при загрузке страницы
    updateCreatedAt();

    // Обновляем время каждую минуту (60000 миллисекунд)
    setInterval(updateCreatedAt, 60000);
});