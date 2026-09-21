function authHeaders() {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    return token ? { Authorization: 'Bearer ' + token } : {};
}
async function readResponse(response) {
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 ? 'Войдите в аккаунт, чтобы открыть избранное.' : result.error || result.message || 'Не удалось обновить избранное.');
    return result;
}
export async function getFavorites() {
    return readResponse(await fetch('/market/get/favorites', { credentials: 'include', headers: authHeaders() }));
}
export async function removeFavorite(listingId) {
    return readResponse(await fetch('/market/favorites/remove', {
        method: 'POST', credentials: 'include', headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId })
    }));
}
