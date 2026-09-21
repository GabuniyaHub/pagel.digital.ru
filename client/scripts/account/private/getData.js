// getData.js
let dataRequest;

export function getData() {
  if (dataRequest) return dataRequest;

  const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  dataRequest = fetch('/account/get/data', {
    method: 'GET',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
    .then(async res => {

      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);

      return res.json();
    })
    .catch(err => {
      dataRequest = undefined;
      console.error('Ошибка при получении данных:', err);
      throw err;
    });

  return dataRequest;
}
