export function injectFavoritesStyles() {
  const style = document.createElement("style");
  style.textContent = `
  .favorites-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(4px);
    transition: opacity 0.3s ease;
  }
  .favorites-overlay.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .favorites-modal {
    background: #1e1e1e;
    color: #f0f0f0;
    padding: 25px;
    border-radius: 16px;
    max-width: 650px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    transition: transform 0.3s ease;
  }

  .favorites-modal h2 {
    margin-bottom: 20px;
    font-size: 24px;
    font-weight: 600;
    color: #ffd700;
    text-align: center;
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    cursor: pointer;
    font-size: 24px;
    color: #ff4c4c;
    transition: transform 0.2s ease, color 0.2s ease;
  }
  .close-btn:hover {
    transform: rotate(90deg);
    color: #ff0000;
  }

  .favorite-item {
    display: flex;
    align-items: center;
    background: linear-gradient(145deg, #2a2a2a, #1b1b1b);
    border-radius: 12px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .favorite-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.6);
  }

  .favorite-item img {
    width: 100px;
    height: 70px;
    object-fit: cover;
    border-radius: 10px;
    margin-right: 20px;
    flex-shrink: 0;
    border: 2px solid #ffd700;
    transition: transform 0.2s ease;
  }
  .favorite-item img:hover {
    transform: scale(1.05);
  }

  .favorite-item .ad-info {
    flex: 1;
  }
  .favorite-item .ad-info strong {
    display: block;
    font-size: 18px;
    margin-bottom: 5px;
    color: #ffd700;
  }
  .favorite-item .ad-info div, .favorite-item .ad-info span {
    font-size: 14px;
    margin-bottom: 3px;
    color: #ccc;
  }

  .favorite-item .ad-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-left: 15px;
  }
  .favorite-item .go-to-listing-btn {
    background: #ffd700;
    color: #1e1e1e;
    padding: 8px 14px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    text-align: center;
    transition: background 0.3s ease;
  }
  .favorite-item .go-to-listing-btn:hover {
    background: #ffb700;
  }
  .favorite-item button.remove-favorite {
    padding: 8px 14px;
    border: none;
    border-radius: 8px;
    background: #ff4c4c;
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease, transform 0.2s ease;
  }
  .favorite-item button.remove-favorite:hover {
    background: #ff0000;
    transform: scale(1.05);
  }
  `;
  document.head.appendChild(style);
}
