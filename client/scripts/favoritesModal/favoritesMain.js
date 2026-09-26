import { injectFavoritesStyles } from './favoritesStyles.js?v=profile-3';
import { createFavoritesModal } from './favoritesHtml.js?v=profile-3';
import { getFavorites, removeFavorite } from './favoritesApi.js?v=profile-3';
import { initFavoritesLogic } from './favoritesLogic.js?v=media-4';
import '/scripts/common/media.js?v=1';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.select-favorites')) return;
    injectFavoritesStyles();
    const modal = createFavoritesModal();
    document.body.append(modal.overlay);
    initFavoritesLogic({ ...modal, getFavorites, removeFavorite });
});
