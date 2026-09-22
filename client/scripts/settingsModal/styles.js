export function injectStyles() {
 if (document.getElementById('settings-modal-styles')) return;
 const style = document.createElement('style'); style.id = 'settings-modal-styles';
 style.textContent = `
 .settings-modal-overlay{position:fixed;inset:0;z-index:1100;padding:18px;background:rgba(30,40,51,.48);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;font-family:Inter,Arial,sans-serif}
 .settings-modal-overlay *{box-sizing:border-box}
 .swal2-container{z-index:1200!important}
 .plgl-security-dialog{font-family:Inter,Arial,sans-serif;border-radius:20px;border:1px solid #e2e8f0}
 .settings-modal{position:relative;width:510px;max-width:100%;max-height:90dvh;overflow:auto;padding:30px;border:1px solid #e2e8f0;border-radius:22px;background:#fff;color:#3b4d61;box-shadow:0 24px 70px #1e283333}
 .settings-modal h2{font-family:'Sofia Sans Extra Condensed',Inter,sans-serif;font-size:32px;line-height:1.1;margin:0 42px 14px 0;color:#1e2833;text-align:left}
 .settings-modal .security-description{font-size:13px;line-height:1.7;color:#65758e}
 .settings-modal .user-data{padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#f5f7fa;margin:20px 0;font-size:13px;overflow-wrap:anywhere}
 .settings-modal .actions{display:grid;gap:10px}
 .settings-modal .actions button{padding:18px;text-align:left;font-family:Inter,Arial,sans-serif;border:1px solid #e2e8f0;border-radius:14px;background:#fff;color:#3b4d61;cursor:pointer}
 .settings-modal .actions button:hover{background:#eef3f8;border-color:#b9c7d6}
 .settings-modal .actions strong,.settings-modal .actions span{display:block}
 .settings-modal .actions span{font-size:12px;margin-top:6px;color:#65758e;line-height:1.5}
 .settings-modal .close-btn{position:absolute;top:20px;right:20px;width:34px;height:34px;background:#eef3f8;border:0;border-radius:10px;color:#3b4d61;font-size:24px;cursor:pointer}
 .settings-modal #settings-error{margin-top:12px;color:#8b4d4d;font-size:13px}
 .settings-modal :focus-visible{outline:3px solid #aebdce;outline-offset:3px}
 @media(max-width:500px){.settings-modal{padding:22px}.settings-modal h2{font-size:28px}}
 `; document.head.append(style);
}
