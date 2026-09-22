import { injectStyles } from './styles.js?v=security-2';
import { createModal } from './html.js?v=security-2';
import { initLogic } from './logic.js?v=security-2';

document.addEventListener("DOMContentLoaded", () => {
  // const settingsIcon = document.querySelector(".fa-cog");
  const settingsLink = document.querySelector("a.settings-link");

  if (settingsLink) {
    settingsLink.addEventListener("click", async (e) => {
      e.preventDefault();
      if (document.querySelector('.settings-modal-overlay')) return;

      // вставляем стили
      injectStyles();

      // создаём модалку
      const modal = createModal();
      document.body.appendChild(modal);

      // инициализируем логику
      initLogic(modal);
    });
  }
});
