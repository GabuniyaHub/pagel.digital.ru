document.addEventListener('DOMContentLoaded', async () => {
    const page = document.getElementById('listing-page');
    const id = page.dataset.listingId;
    const notice = (message, type = 'info') => window.PlglNotifications?.show(message, type);
    const media = window.PlglMedia;
    async function request(url, options = {}) {
        if (!await window.PlglAuth.require()) throw new Error('Необходим вход в аккаунт.');
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || data.message || 'Не удалось выполнить действие. Попробуйте ещё раз.');
        return data;
    }
    const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const dialogs = [...document.querySelectorAll('.listing-dialog')];
    const showDialog = dialog => { dialog.showModal(); document.body.style.overflow = 'hidden'; };
    dialogs.forEach(dialog => {
        dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
        dialog.addEventListener('click', event => {
            if (event.target.closest('[data-close]')) dialog.close();
            if (event.target === dialog) {
                const rect = dialog.getBoundingClientRect();
                if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
            }
        });
    });
    document.addEventListener('click', event => {
        const button = event.target.closest('[data-dialog]');
        if (button) showDialog(document.getElementById(button.dataset.dialog));
    });
    document.getElementById('share-listing').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.origin + location.pathname); notice('Ссылка на объявление скопирована.'); }
        catch { notice('Не удалось скопировать. Скопируйте ссылку из адресной строки.', 'error'); }
    });
    const favorite = document.getElementById('favorite-toggle');
    function setFavorite(active) {
        favorite.setAttribute('aria-pressed', String(active));
        favorite.textContent = active ? '♥ В избранном' : '♡ Добавить в избранное';
    }
    favorite.addEventListener('click', async () => {
        favorite.disabled = true;
        try { const data = await request('/market/add/favorites', json({ listingId: id })); setFavorite(Boolean(data.data)); notice(data.message); }
        catch (error) { notice(error.message, 'error'); }
        finally { favorite.disabled = false; }
    });
    document.addEventListener('plgl-favorite-removed', event => { if (String(event.detail) === id) setFavorite(false); });
    const gallery = [...document.querySelectorAll('.gallery-trigger')];
    const galleryDialog = document.getElementById('gallery-dialog');
    let imageIndex = 0;
    function showImage(index) {
        imageIndex = (index + gallery.length) % gallery.length;
        document.getElementById('gallery-image').src = gallery[imageIndex].dataset.image;
        document.getElementById('gallery-counter').textContent = (imageIndex + 1) + ' / ' + gallery.length;
        document.getElementById('gallery-prev').hidden = document.getElementById('gallery-next').hidden = gallery.length < 2;
    }
    gallery.forEach((button, index) => button.addEventListener('click', () => { showImage(index); showDialog(galleryDialog); }));
    document.getElementById('gallery-prev').addEventListener('click', () => showImage(imageIndex - 1));
    document.getElementById('gallery-next').addEventListener('click', () => showImage(imageIndex + 1));
    galleryDialog.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showImage(imageIndex + (event.key === 'ArrowLeft' ? -1 : 1)); }
    });
    document.getElementById('raise-listing')?.addEventListener('click', async event => {
        const button = event.currentTarget; button.disabled = true;
        try {
            const data = await request('/market/listings/' + id + '/up', { method: 'POST' });
            document.getElementById('raised-at').textContent = 'Поднято: ' + new Date(data.up_date).toLocaleString('ru-RU');
            notice(data.message);
        } catch (error) { notice(error.message, 'error'); }
        finally { button.disabled = false; }
    });
    document.getElementById('delete-listing')?.addEventListener('click', async event => {
        const button = event.currentTarget; button.disabled = true;
        const errorBox = document.getElementById('delete-error'); errorBox.hidden = true;
        try { await request('/market/listings/' + id + '/delete', { method: 'DELETE' }); location.assign(page.dataset.catalogPath); }
        catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; button.disabled = false; }
    });
    document.getElementById('listing-edit-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget, button = form.querySelector('[type=submit]');
        const errorBox = document.getElementById('edit-error'); errorBox.hidden = true;
        button.disabled = true;
        try {
            const data = new FormData(form);
            data.set('existingScreenshots', JSON.stringify(data.getAll('keepScreenshot')));
            data.delete('keepScreenshot');
            for (const key of ['allow_comments', 'show_link', 'monetization']) if (form.elements[key]) data.set(key, String(form.elements[key].checked));
            const contacts = ['telegram', 'email', 'whatsapp'].map(key => data.get('contacts[' + key + ']')).filter(value => value?.trim());
            if (!contacts.length) throw new Error('Добавьте хотя бы один способ связи.');
            const files = [...data.values()].filter(value => value instanceof File && value.size);
            if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) throw new Error('Допускаются JPG, PNG и WEBP до 5 МБ.');
            await request('/market/listings/' + id + '/edit', { method: 'PUT', body: data });
            location.reload();
        } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; errorBox.scrollIntoView({ block: 'nearest' }); }
        finally { button.disabled = false; }
    });
    let replyId = null;
    const textarea = document.getElementById('comment-text');
    function resetReply() { replyId = null; document.getElementById('reply-banner').hidden = true; }
    document.getElementById('cancel-reply')?.addEventListener('click', resetReply);
    document.getElementById('comments-list').addEventListener('click', event => {
        const button = event.target.closest('[data-reply-id]');
        if (!button || !textarea) return;
        replyId = button.dataset.replyId;
        const banner = document.getElementById('reply-banner'); banner.hidden = false;
        banner.querySelector('span').textContent = 'Ответ для ' + button.dataset.replyName;
        textarea.focus(); textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    textarea?.addEventListener('input', () => { document.getElementById('comment-length').textContent = textarea.value.length; });
    function element(tag, className, text) {
        const node = document.createElement(tag); if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }
    function appendComment(comment, parentName) {
        const article = element('article', 'listing-comment'); article.id = 'comment-' + comment.id; article.dataset.commentId = comment.id;
        const avatar = element('img', 'comment-avatar'); avatar.src = media.avatarUrl(comment.author_avatar); avatar.dataset.fallback = media.fallbackAvatar; avatar.alt = '';
        const body = element('div', 'comment-body'), byline = element('div', 'comment-byline');
        const author = element('a', '', comment.author_name || 'Пользователь'); author.href = '/account/public/' + comment.user_id;
        byline.append(author);
        if (String(comment.user_id) === page.dataset.sellerId) byline.append(element('span', 'author-badge', 'Автор объявления'));
        const time = element('time', '', new Date(comment.created_at).toLocaleString('ru-RU')); time.dateTime = new Date(comment.created_at).toISOString(); byline.append(time); body.append(byline);
        if (comment.parent_id) {
            const context = element('a', 'reply-context', '↳ Ответ для ' + parentName); context.href = '#comment-' + comment.parent_id; body.append(context);
        }
        body.append(element('p', '', comment.message));
        const reply = element('button', 'text-button reply-button', 'Ответить'); reply.type = 'button'; reply.dataset.replyId = comment.id; reply.dataset.replyName = comment.author_name || 'Пользователь'; body.append(reply);
        article.append(avatar, body);
        const parent = comment.parent_id && document.getElementById('comment-' + comment.parent_id);
        if (parent) { article.classList.add('is-reply'); parent.closest('.comment-thread').querySelector('.comment-replies').append(article); }
        else {
            const thread = element('div', 'comment-thread'); thread.dataset.threadId = comment.id;
            thread.append(article, element('div', 'comment-replies')); document.getElementById('comments-list').prepend(thread);
        }
        document.getElementById('comments-empty').hidden = true;
        const count = Number(document.getElementById('comment-count').textContent) + 1;
        document.getElementById('comment-count').textContent = document.getElementById('comment-tab-count').textContent = count;
        article.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.getElementById('comment-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const message = textarea.value.trim(); if (!message) return;
        const button = event.currentTarget.querySelector('[type=submit]'), errorBox = document.getElementById('comment-error');
        button.disabled = true; errorBox.hidden = true;
        const parentId = replyId;
        const parentName = parentId ? document.getElementById('comment-' + parentId)?.querySelector('[data-reply-name]')?.dataset.replyName || 'Пользователь' : '';
        try {
            const data = await request('/market/add/comments', json({ listingId: id, message, parentId }));
            appendComment(data.comment, parentName); textarea.value = ''; document.getElementById('comment-length').textContent = '0'; resetReply();
        } catch (error) { errorBox.textContent = error.message; errorBox.hidden = false; }
        finally { button.disabled = false; }
    });
    try {
        if (!await window.PlglAuth.require()) return;
        const { user } = await window.PlglAuth.session;
        const avatar = document.getElementById('comment-viewer-avatar');
        if (avatar) { avatar.src = media.avatarUrl(user.avatar); avatar.dataset.fallback = media.fallbackAvatar; }
        request('/market/items/' + id + '/view', { method: 'POST' }).then(data => { if (data.views != null) document.getElementById('listing-views').textContent = Number(data.views).toLocaleString('ru-RU'); }).catch(() => {});
        request('/market/get/user/reviews/' + page.dataset.sellerId).then(data => {
            document.querySelector('#seller-reviews strong').textContent = Number(data.positive_count || 0) + ' положительных · ' + Number(data.neutral_count || 0) + ' нейтральных · ' + Number(data.negative_count || 0) + ' отрицательных';
            document.getElementById('seller-reviews').title = 'Положительные / нейтральные / отрицательные';
        }).catch(() => { document.querySelector('#seller-reviews strong').textContent = 'Посмотреть в профиле'; });
    } catch (error) { notice(error.message, 'error'); }
});
