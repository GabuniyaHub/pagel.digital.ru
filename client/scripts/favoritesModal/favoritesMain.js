import { injectFavoritesStyles } from './favoritesStyles.js?v=profile-3';
import { createFavoritesModal } from './favoritesHtml.js?v=profile-3';
import { getFavorites, removeFavorite } from './favoritesApi.js?v=profile-3';
import { initFavoritesLogic } from './favoritesLogic.js?v=profile-3';

document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('.select-favorites')) return;
    injectFavoritesStyles();
    const modal = createFavoritesModal();
    document.body.append(modal.overlay);
    initFavoritesLogic({ ...modal, getFavorites, removeFavorite });
});
