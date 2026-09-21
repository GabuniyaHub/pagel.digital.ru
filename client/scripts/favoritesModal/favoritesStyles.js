export function injectFavoritesStyles() {
    if (document.getElementById('plgl-favorites-styles')) return;
    const style = document.createElement('style');
    style.id = 'plgl-favorites-styles';
    style.textContent = `
      .favorites-overlay[hidden]{display:none!important}
      .favorites-overlay{position:fixed;inset:0;z-index:1000;background:rgba(30,40,51,.48);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif;color:#3b4d61}
      .favorites-overlay *{box-sizing:border-box}
      .favorites-modal{width:780px;max-width:100%;max-height:88vh;overflow:auto;border-radius:22px;background:#f5f7fa;box-shadow:0 24px 80px #1e283333;border:1px solid #e2e8f0}
      .favorites-heading{position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;align-items:center;padding:24px;background:#fff;border-bottom:1px solid #e2e8f0}
      .favorites-heading h2{font-family:'Sofia Sans Extra Condensed',Inter,sans-serif;font-size:34px;color:#1e2833;margin:0;text-align:left}
      .favorites-heading p{margin:5px 0 0;font-size:13px;color:#65758e}
      .favorites-close{border:0;border-radius:12px;background:#eef3f8;color:#3b4d61;width:40px;height:40px;flex:none;font-size:27px;cursor:pointer}
      .favorites-list{padding:24px;display:grid;gap:12px}
      .favorite-item{display:flex;align-items:center;gap:16px;padding:18px;border-radius:16px;border:1px solid #e2e8f0;background:#fff;box-shadow:0 4px 16px #3b4d6108}
      .favorite-item:hover{border-color:#bac7d5}
      .favorite-item img{width:64px;height:64px;border-radius:12px;object-fit:cover;flex:none}
      .favorite-detail{flex:1;min-width:0;overflow-wrap:anywhere}
      .favorite-detail strong{display:block;font-size:14px;color:#1e2833}
      .favorite-detail p{font-size:12px;color:#65758e;margin:6px 0}
      .favorite-actions{display:grid;gap:8px}
      .favorite-actions a,.favorite-actions button,.favorites-retry{padding:10px 14px;font:600 12px Inter,Arial,sans-serif;border:0;border-radius:10px;cursor:pointer;text-align:center;text-decoration:none;background:linear-gradient(135deg,#3b4d61,#65758e);color:#fff}
      .favorite-actions button{background:#eef3f8;color:#3b4d61}
      .favorite-actions button:disabled{opacity:.5;cursor:wait}
      .favorites-state{text-align:center;padding:45px 12px;color:#65758e;font-size:14px;line-height:1.7}
      .favorites-overlay :focus-visible{outline:3px solid #aebdce;outline-offset:3px}
      @media(max-width:560px){.favorites-overlay{padding:10px}.favorites-list,.favorites-heading{padding:16px}.favorite-item{flex-wrap:wrap}.favorite-actions{width:100%;grid-template-columns:1fr 1fr}.favorites-heading h2{font-size:30px}}
    `;
    document.head.append(style);
}
