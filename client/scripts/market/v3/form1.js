document.addEventListener('DOMContentLoaded', () => {
    const codeBlock = document.getElementById('ownership-code');
    if (!codeBlock) return;

    fetch('/market/ownership-code', { method: 'POST' })
        .then(response => {
            if (!response.ok) throw new Error('Не удалось получить код подтверждения.');
            return response.json();
        })
        .then(data => {
            codeBlock.textContent = data.code || 'Не удалось получить код подтверждения.';
        })
        .catch(() => {
            codeBlock.textContent = 'Код подтверждения временно недоступен. Обновите страницу.';
        });
});
