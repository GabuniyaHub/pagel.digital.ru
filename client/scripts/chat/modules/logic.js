// uploaded:logic.js

import { getCurrentUserData, getUserChats, getChatMessages, getAllUsers, sendMessage, sendFirstMessageToUser } from "./modules/api"; 

// --- Глобальное состояние ---
let currentUserId = null;
let currentChatId = null;
let nextMessageCursor = ""; // 2) Курсор (current message)
let isLoadingMessages = false;
let allUsers = []; // 5) Список всех пользователей
const MESSAGES_LIMIT = 100; // 2) limit = 100

// --- Утилиты рендера сообщений ---

/**
 * Рендер сообщений в DOM.
 * @param {Array} msgs - Массив сообщений.
 * @param {boolean} prepend - Если true, добавляет сообщения в начало (для прогрузки вверх).
 */
function renderMessages(msgs, prepend = false) {
    const messagesEl = document.getElementById("messages");
    if (!prepend) {
        messagesEl.innerHTML = ""; 
    }

    const fragment = document.createDocumentFragment();

    msgs.forEach(m => {
        const el = document.createElement("div");
        const isMyMessage = m.sender_id === currentUserId;
        el.className = `message ${isMyMessage ? 'my-message' : 'other'}`;
        // Предполагаем, что сообщение имеет поля 'text', 'sender_id', 'timestamp'
        el.innerHTML = `
            <div class="message-bubble">${m.text}</div>
            <div class="message-time">${new Date(m.timestamp).toLocaleTimeString()}</div>
        `;
        fragment.appendChild(el);
    });

    if (prepend) {
        messagesEl.prepend(fragment); 
    } else {
        messagesEl.appendChild(fragment); 
    }
}

// --- 3) Логика динамической прогрузки сообщений (Infinite Scroll UP) ---

async function loadMoreMessages() {
    // Выход: если идет загрузка, нет чата, или курсор пуст (больше нет сообщений)
    if (isLoadingMessages || nextMessageCursor === null || !currentChatId) {
        return;
    }

    isLoadingMessages = true;
    const messagesContainer = document.getElementById("messagesContainer");
    const oldScrollHeight = messagesContainer.scrollHeight;

    try {
        // 2) Передаем limit=100 и cursor
        const { messages, nextCursor } = await getChatMessages(
            currentChatId,
            MESSAGES_LIMIT,
            nextMessageCursor
        );

        nextMessageCursor = nextCursor || null; // Обновляем курсор
        renderMessages(messages, true); // Добавляем в начало

        // Восстанавливаем позицию прокрутки для "бесшовной" загрузки
        const newScrollHeight = messagesContainer.scrollHeight;
        messagesContainer.scrollTop = newScrollHeight - oldScrollHeight;

    } catch (error) {
        console.error("Ошибка загрузки сообщений:", error);
    } finally {
        isLoadingMessages = false;
    }
}

function initScrollObserver() {
    const messagesContainer = document.getElementById("messagesContainer");
    
    // Отслеживаем прокрутку: если scrollTop близко к 0, загружаем старые сообщения
    messagesContainer.addEventListener('scroll', () => {
        if (messagesContainer.scrollTop < 50 && currentChatId) {
            loadMoreMessages();
        }
    });
}


// --- Логика чатов и активации ---

async function activateChat(chatId) {
    if (currentChatId === chatId) return;
    
    // Визуальное выделение активного чата
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
    document.querySelector(`.chat-item[data-id="${chatId}"]`)?.classList.add('active');
    
    currentChatId = chatId;
    nextMessageCursor = ""; // Сбрасываем курсор для нового чата
    
    try {
        // Первая загрузка сообщений
        const { messages, nextCursor } = await getChatMessages(currentChatId, MESSAGES_LIMIT, nextMessageCursor);
        nextMessageCursor = nextCursor || null;
        renderMessages(messages, false);
        
        // Прокрутка вниз при открытии чата
        document.getElementById("messagesContainer").scrollTop = document.getElementById("messagesContainer").scrollHeight;
        
    } catch (error) {
        console.error("Ошибка активации чата:", error);
    }
}

function setupChatList(chats) {
    const chatList = document.getElementById("chatList");
    chatList.innerHTML = ''; 

    chats.forEach(chat => {
        const item = document.createElement("div");
        item.className = "chat-item";
        item.dataset.id = chat.chat_id;
        // ... рендер элемента чата с именем/аватаром ...
        item.innerHTML = `
            <div class="chat-avatar">${chat.chat_name[0].toUpperCase()}</div>
            <div class="chat-item-content">
                <div class="chat-item-header">
                    <div class="chat-name">${chat.chat_name}</div>
                    <div class="chat-time">${chat.last_message_time || ''}</div>
                </div>
                <div class="chat-last-message">${chat.last_message_text || 'Нет сообщений'}</div>
            </div>
        `;
        
        item.onclick = () => activateChat(chat.chat_id);
        chatList.appendChild(item);
    });
}


// --- 6) Логика выбора пользователя и отправки сообщения ---

// 5) Загрузка всех пользователей
async function loadAndDisplayAllUsers() {
    const allUsersContainer = document.getElementById("allUsersContainer");
    const userSearchInput = document.getElementById("userSearchInput");

    // Если контейнер скрыт, показываем его и загружаем данные
    if (allUsersContainer.style.display !== 'block') {
        if (allUsers.length === 0) {
            try {
                const userData = await getAllUsers(); // 5) Запрос на getAllUsers
                // Фильтруем текущего пользователя из списка
                allUsers = userData.users.filter(u => u.user_id !== currentUserId); 
            } catch (error) {
                console.error("Ошибка загрузки всех пользователей:", error);
                allUsersContainer.style.display = 'none'; 
                return;
            }
        }
        renderUserList(allUsers);
        allUsersContainer.style.display = 'block';
        userSearchInput.value = '';
        userSearchInput.focus();
    }
}

// Отображение списка пользователей
function renderUserList(users) {
    const allUsersList = document.getElementById("allUsersList");
    allUsersList.innerHTML = '';

    if (users.length === 0) {
        allUsersList.innerHTML = '<div class="user-item-empty">Пользователи не найдены</div>';
        return;
    }

    users.forEach(user => {
        const userEl = document.createElement("div");
        userEl.className = "user-item";
        // 6) Поиск происходит по никнейму, используем никнейм для отображения
        userEl.textContent = user.nickname || `Пользователь ID: ${user.user_id}`;
        // Возможность выбрать пользователя
        userEl.onclick = () => selectNewChatUser(user);
        allUsersList.appendChild(userEl);
    });
}

// Логика поиска по никнейму
function setupUserSearch() {
    const userSearchInput = document.getElementById("userSearchInput");
    userSearchInput.addEventListener('input', (e) => {
        const searchText = e.target.value.toLowerCase();
        const filteredUsers = allUsers.filter(user => 
            // 6) Поиск происходит по никнейму
            user.nickname && user.nickname.toLowerCase().includes(searchText)
        );
        renderUserList(filteredUsers);
    });
}

// Выбор пользователя
function selectNewChatUser(user) {
    document.getElementById("allUsersContainer").style.display = 'none'; 
    
    Swal.fire({
        title: `Начать чат с ${user.nickname}?`,
        input: 'text',
        inputPlaceholder: 'Введите первое сообщение...',
        showCancelButton: true,
        confirmButtonText: 'Отправить',
        // Отправляем сообщение
        preConfirm: (messageText) => { 
            if (!messageText || messageText.trim() === '') {
                Swal.showValidationMessage('Сообщение не может быть пустым');
                return false;
            }
            return sendInitialMessage(user.user_id, messageText);
        }
    });
}

// Отправка первого сообщения (создание/поиск чата на сервере)
async function sendInitialMessage(targetUserId, messageText) {
    try {
        Swal.showLoading();
        // 6) Используем ручку, которая передает senderID и targetUserID
        const { newChat, message } = await sendFirstMessageToUser(currentUserId, targetUserId, messageText);
        
        // 1) Обновить список чатов и открыть новый чат
        const chats = await getUserChats(currentUserId);
        setupChatList(chats);
        await activateChat(newChat.chat_id);
        
        Swal.close();
        
    } catch (error) {
        Swal.close();
        console.error("Ошибка создания чата/отправки сообщения:", error);
        Swal.fire('Ошибка', `Не удалось отправить первое сообщение: ${error.message}`, 'error');
        throw error;
    }
}

// Отправка сообщения в активный чат
const handleSendMessage = async () => {
    const messageInput = document.getElementById("messageInput");
    const text = messageInput.value.trim();
    if (text && currentChatId) {
        try {
            const newMessage = await sendMessage(currentChatId, currentUserId, text);
            // Добавляем новое сообщение в конец
            renderMessages([newMessage], false); 
            messageInput.value = ""; 
            // Прокрутка вниз
            document.getElementById("messagesContainer").scrollTop = document.getElementById("messagesContainer").scrollHeight;
        } catch (error) {
            console.error("Ошибка отправки сообщения:", error);
        }
    }
};


// --- Инициализация ---

document.addEventListener('DOMContentLoaded', async() => {
    
    // 4) Получение данных текущего пользователя
    try {
        const userData = await getCurrentUserData(); 
        currentUserId = userData.user_id;
    } catch (error) {
        console.log("Авторизация не пройдена.");
        return; 
    }
    
    const newChatButton = document.getElementById("newChatButton");
    const sendBtn = document.getElementById("sendBtn");
    const messageInput = document.getElementById("messageInput");
    const allUsersContainer = document.getElementById("allUsersContainer");
    
    // Первая загрузка чатов
    try{
        const chats = await getUserChats(currentUserId); 
        setupChatList(chats);
        
        // Активация первого чата по умолчанию
        if (chats.length > 0) {
            await activateChat(chats[0].chat_id);
        }
    } catch (error) {
        console.error("Ошибка загрузки чатов:", error);
    }

    // Инициализация динамической прогрузки и поиска пользователей
    initScrollObserver();
    setupUserSearch();
    
    // 6) Логика отображения списка пользователей при наведении на "Новый чат"
    let hideTimeout;
    const hideUsersContainer = () => {
        hideTimeout = setTimeout(() => {
            allUsersContainer.style.display = 'none';
        }, 300); 
    };
    
    const cancelHide = () => {
        clearTimeout(hideTimeout);
    };

    newChatButton.addEventListener('mouseover', loadAndDisplayAllUsers);
    newChatButton.addEventListener('mouseout', hideUsersContainer);
    // Предотвращаем закрытие при перемещении курсора на сам список пользователей
    allUsersContainer.addEventListener('mouseover', cancelHide);
    allUsersContainer.addEventListener('mouseout', hideUsersContainer);
    
    // Дополнительно по клику, чтобы открыть список и на мобильных устройствах
    newChatButton.addEventListener('click', loadAndDisplayAllUsers);
    

    // Привязка обработчиков отправки сообщения
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
            e.preventDefault();
        }
    });
});