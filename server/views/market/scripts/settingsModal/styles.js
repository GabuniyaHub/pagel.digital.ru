export function injectStyles() {
  if (document.getElementById("settings-modal-styles")) return;

  const style = document.createElement("style");
  style.id = "settings-modal-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

    body.blurred > *:not(.settings-modal-overlay) {
      filter: blur(6px);
      pointer-events: none;
      user-select: none;
    }

    .settings-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(6px);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
      font-family: 'Inter', sans-serif;
    }

    .settings-modal {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border-radius: 16px;
      padding: 28px;
      width: 420px; max-width: 90%;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
      animation: fadeIn .3s ease;
      color: #fff;
    }

    .settings-modal h2 {
      margin-top: 0;
      font-weight: 600;
      font-size: 1.4rem;
      text-align: center;
      color: #fff;
    }

    .settings-modal button {
      margin: 10px 0;
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 10px;
      background: rgba(255,255,255,0.1);
      color: #fff;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      transition: all .3s ease;
    }

    .settings-modal button:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    .settings-modal button:active {
      transform: translateY(0);
    }

    .close-btn {
      float: right; cursor: pointer;
      font-size: 22px; font-weight: bold;
      color: rgba(255,255,255,0.7);
      transition: color .2s ease;
    }

    .close-btn:hover {
      color: #fff;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(.9); }
      to { opacity: 1; transform: scale(1); }
    }
  `;

  document.head.appendChild(style);
}
