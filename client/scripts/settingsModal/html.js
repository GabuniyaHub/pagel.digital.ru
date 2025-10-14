export function createModal() {
  const overlay = document.createElement("div");
  overlay.classList.add("settings-modal-overlay");

  overlay.innerHTML = `
    <div class="settings-modal">
      <span class="close-btn">&times;</span>
      <h2>Настройки</h2>
      <div class="user-data">
        <p><strong>Email:</strong> <span id="user-email">Загрузка...</span></p>
      </div>
      <div class="actions">
        <button id="change-password-btn">Сменить пароль</button>
        <button id="change-email-btn">Сменить почту</button>
        <button id="delete-account-btn">Удалить аккаунт</button>
      </div>
      <div id="settings-error" style="color:red; margin-top:10px;"></div>
    </div>
  `;
  return overlay;
}
