// <!-- Оставлять комментарии -->
let lastSentMessage = null;

document.getElementById('send-comment')?.addEventListener('click', async () => {
    const messageInput = document.getElementById('comment-text');
    const message = messageInput.value.trim();
    const listingId = <%= listing.id %>;

    if (!message) return;

    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');

    if (!token) {
        return Swal.fire({
        icon: 'warning',
        title: 'Необходимо войти',
        text: 'Чтобы оставить комментарий, войдите в систему.',
        confirmButtonText: 'Ок'
        });
    }

    if (message === lastSentMessage) {
        return Swal.fire({
        icon: 'info',
        title: 'Повтор комментария',
        text: 'Вы уже отправили такой комментарий.',
        confirmButtonText: 'Понял'
        });
    }

    try {
        const response = await fetch('/market/add/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listingId, message })
        });

        const data = await response.json();

        if (response.ok && data.comment) {
            const comment = data.comment;
            const block = document.querySelector('.post-footer-comments-block');
            const div = document.createElement('div');
            div.classList.add('comment');

            if (comment.user_id === <%= currentUser?.id || 'null' %>) {
                div.classList.add('my-comment');
            }


            const date = new Date(comment.created_at);
            const formattedDateTime = date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });


            div.innerHTML = `
                <img src="${comment.author_avatar}" alt="аватар" class="avatar">
                <div class="comment-content">
                <strong>${comment.author_name}:</strong> ${comment.message}
                <div class="comment-time">${formattedDateTime}</div>
                </div>
            `;

                // div.innerHTML = `
                //   <img src="${comment.author_avatar}" alt="аватар" class="avatar">
                //   <strong>${comment.author_name}:</strong> ${comment.message}
                // `;
                //block.appendChild(div); //добавляем в конец
            block.prepend(div); //добавляем в начало
                messageInput.value = '';
                lastSentMessage = message;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Ошибка',
                text: data.error || 'Ошибка при отправке комментария.',
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Сервер не отвечает',
            text: 'Попробуйте позже.',
        });
    }
});