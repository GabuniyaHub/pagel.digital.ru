// getPublicData.js
export async function getPublicData() {
  try {
    // Берём userId из URL
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const userId = pathParts[pathParts.length - 1];

    if (!userId) throw new Error('userId не найден в URL');

    // Делаем запрос на API для публичного профиля
    const res = await fetch(`/account/public/get/${userId}`, { method: 'GET' });

    if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);

    const data = await res.json();
    // console.log('Публичные данные пользователя:', data);

    return data;
  } catch (err) {
    console.error('Ошибка при получении публичных данных:', err);
    throw err;
  }
}
