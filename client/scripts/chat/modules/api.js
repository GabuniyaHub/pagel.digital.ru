import client from "./grpcClient.js"

export function getUserChats(userId) {
    return new Promise((resolve, reject) => {
        client.getUserChats(
            { user_id: userId },
            (err, response) => {
                if (err) {
                    return reject(err); 
                }
                resolve(response.chats); 
            }
        );
    });
}

export function getChatMessages(chatId, limit = 100, cursor = "") {
    return new Promise((resolve, reject) => {
        client.getChatMessages(
            { chat_id: chatId, limit: limit, cursor: cursor }, 
            (err, response) => {
                if (err) {
                    return reject(err); 
                }
                // Для динамической прогрузки (infinite scroll) необходимо вернуть следующий курсор
                resolve({
                    messages: response.messages,
                    nextCursor: response.next_cursor || "" 
                });
            }
        );
    });
}

export async function getAllUsers() {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    try {
        const response = fetch('/chat/get/data/all/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });

         if (response.status === 401 || response.status === 403) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Авторизация',
                    text: 'Сессия истекла. Пожалуйста, войдите снова.',
                    confirmButtonText: 'ОК'
                }).then(() => {
                    window.location.href = '/pages/user-auth/login.html';
                });
                return;
            }

        const AllUsersData = await response.json();
        return AllUsersData;
    } catch (error) {
        console.error('Ошибка при получении всех пользователей:', error);
        throw error;
    }
}

export async function getCurrentUserData() {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    try {
        const response = await fetch('/chat/get/data/current/user', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            Swal.fire({
                icon: 'warning',
                title: 'Авторизация',
                text: 'Сессия истекла. Пожалуйста, войдите снова.',
                confirmButtonText: 'ОК'
            }).then(() => {
                window.location.href = '/pages/user-auth/login.html';
            });
            return;
        }
        const currentUserData = await response.json();
        return currentUserData;
    } catch (error) {
        console.error('Ошибка при получении данных текущего пользователя:', error);
        throw error;
    }
}