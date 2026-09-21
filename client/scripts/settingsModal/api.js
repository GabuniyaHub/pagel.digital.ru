export async function fetchUserSettings() {
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    
    try {
    const res = await fetch("/settings/get", { 
        method: "GET", 
        headers: { 
            "Content-Type": "application/json", 
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        // credentials: "include" 
    });
    if (!res.ok) throw new Error(`Ошибка: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Ошибка получения настроек:", err);
    throw err;
  }
}

export async function confirmAction(route, payload) {
  try {
    const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
    const res = await fetch(route, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(payload)
    });

    // Если ответ не "ок" (например, 401, 400, 500)
    if (!res.ok) {
        // Считываем тело ответа, чтобы получить сообщение об ошибке с сервера
        const errorData = await res.json();
        // Создаем и выбрасываем новую ошибку с сообщением от сервера
        throw new Error(errorData.message || `Ошибка: ${res.statusText}`);
    }

    // Если ответ успешен, возвращаем данные
    return await res.json();

  } catch (err) {
    console.error("Ошибка при запросе:", err);
    // Возвращаем объект с ошибкой, чтобы его можно было обработать в logic.js
    return { error: err.message };
  }
}
