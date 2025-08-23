let currentPage = 1;

document.addEventListener('click', async (e) => {
  if (e.target && e.target.id === 'load-more') {
    currentPage++;
    const res = await fetch(`?page=${currentPage}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    const html = await res.text();

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Вставить только карточки
    const newCards = tempDiv.querySelectorAll('.listing-card');
    newCards.forEach(card => {
      document.getElementById('listings-container').appendChild(card);
    });

    // Заменить или удалить кнопку
    const newButton = tempDiv.querySelector('#load-more');
    const oldButton = document.getElementById('load-more');
    if (newButton) {
      oldButton.replaceWith(newButton);
    } else {
      oldButton.remove();
    }
  }
});
