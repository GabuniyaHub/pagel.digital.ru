import { injectStyles } from './styles.js';
import { createModal } from './html.js';
import { initLogic } from './logic.js';

document.addEventListener("DOMContentLoaded", () => {
  // const settingsIcon = document.querySelector(".fa-cog");
  const settingsLink = document.querySelector("a.settings-link");

  if (settingsLink) {
    settingsLink.addEventListener("click", async (e) => {
      e.preventDefault();

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
