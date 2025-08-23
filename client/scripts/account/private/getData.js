// getData.js
export async function getData() {
  try {
    const res = await fetch('/account/get/data', { method: 'GET', credentials: 'include' });

    if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);

    const data = await res.json();
    // console.log('Полученные данные:', data);

    return data;
  } catch (err) {
    console.error('Ошибка при получении данных:', err);
  }
}

// Запуск функции сразу при загрузке модуля
getData();
