// <!-- подменить англ на русский -->

document.addEventListener('DOMContentLoaded', function () {

  const contentTypeMap = {
    "unique": "Уникальный",
    "copy": "Переписанный",
    "not_unique": "Неуникальный",
    "mixed": "Смешанный",
    "rewrite": "Переписанный",
  };

  const el = document.getElementById('content-type');
  // console.log(el);
  if (el) {
    const value = el.textContent.trim();
    // console.log(value)
    if (contentTypeMap[value]) {
      el.textContent = contentTypeMap[value];
    }
  }
});