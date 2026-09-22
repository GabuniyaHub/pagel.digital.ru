export function createModal() {
  const overlay = document.createElement("div");
  overlay.classList.add("settings-modal-overlay");

  overlay.innerHTML = `
    <div class="settings-modal" role="dialog" aria-modal="true" aria-labelledby="security-title">
      <button type="button" class="close-btn" aria-label="Закрыть безопасность аккаунта">&times;</button>
      <h2 id="security-title">Безопасность аккаунта</h2>
      <p class="security-description">Управляйте доступом к профилю и подтверждайте важные изменения по почте.</p>
      <div class="user-data">
        <p><strong>Email:</strong> <span id="user-email">Загрузка...</span></p>
      </div>
      <div class="actions">
        <button id="change-password-btn"><strong>Изменить пароль</strong><span>Установите новый пароль для входа</span></button>
        <button id="change-email-btn"><strong>Изменить почту</strong><span>Обновите адрес для входа и подтверждений</span></button>
        <button id="delete-account-btn"><strong>Удалить аккаунт</strong><span>Потребуется подтверждение — действие необратимо</span></button>
      </div>
      <div id="settings-error" role="alert"></div>
    </div>
  `;
  return overlay;
}
