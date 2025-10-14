export async function getFavorites() {
  const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");

  if (!token) {
    throw new Error("Необходима авторизация для получения избранного");
  }

  const res = await fetch("/market/get/favorites", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    throw new Error(`Ошибка получения избранного: ${res.status}`);
  }

  return res.json();
}

export async function removeFavorite(listingId) {
  return fetch("/market/favorites/remove", {
    method: "POST",
    headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwt") || sessionStorage.getItem("jwt")}` },
    body: JSON.stringify({ listingId }),
  });
  
}
