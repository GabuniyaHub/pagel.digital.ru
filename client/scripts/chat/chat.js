// scripts/chat.js
class Chat {
    constructor() {
        this.currentChat = 'Гарант';
        this.messages = {
            'Гарант': [
                { type: 'other', text: 'Здравствуйте! Я — ваш гарант. Все сделки проходят через меня ✅', time: '12:30' },
                { type: 'other', text: 'Готов помочь с проведением безопасной сделки. Расскажите, что вас интересует?', time: '12:31' },
                { type: 'user', text: 'Добрый день! Хочу купить аккаунт Steam', time: '12:32' },
                { type: 'other', text: 'Отлично! У нас есть несколько проверенных предложений. Могу показать вам варианты', time: '12:33' }
            ],
            'Алексей': [
                { type: 'other', text: 'Привет! Аккаунт еще доступен?', time: '10:15' },
                { type: 'user', text: 'Да, доступен. Можем обсудить детали', time: '10:20' },
                { type: 'other', text: 'Окей, жду ответ', time: '10:25' }
            ],
            'Мария': [
                { type: 'user', text: 'Спасибо за быструю доставку!', time: '09:45' },
                { type: 'other', text: 'Всегда рады помочь! 😊', time: '09:46' },
                { type: 'user', text: 'Спасибо за помощь ❤️', time: '09:47' }
            ]
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChat(this.currentChat);
        this.setupMobileMenu();
    }

    bindEvents() {
        // Переключение чатов
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatName = item.dataset.name;
                this.switchChat(chatName);
                
                // На мобильных закрываем сайдбар после выбора чата
                if (window.innerWidth <= 768) {
                    document.getElementById('sidebar').classList.remove('active');
                }
            });
        });

        // Отправка сообщения
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');

        sendBtn.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Поиск в чатах
        const navSearch = document.getElementById('navSearch');
        navSearch.addEventListener('input', (e) => this.filterChats(e.target.value));

        // Инструменты чата
        document.querySelectorAll('.chat-input-tool').forEach(tool => {
            tool.addEventListener('click', (e) => {
                const title = e.currentTarget.title;
                this.showTooltip(title + ' - функция в разработке');
            });
        });
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Закрываем сайдбар при клике на основную область на мобильных
        if (window.innerWidth <= 768) {
            document.querySelector('.chat-area').addEventListener('click', () => {
                sidebar.classList.remove('active');
            });
        }
    }

    switchChat(chatName) {
        // Убираем активный класс у всех чатов
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });

        // Добавляем активный класс выбранному чату
        const activeChat = document.querySelector(`.chat-item[data-name="${chatName}"]`);
        if (activeChat) {
            activeChat.classList.add('active');
        }

        this.currentChat = chatName;
        this.loadChat(chatName);
    }

    loadChat(chatName) {
        const messagesContainer = document.getElementById('messages');
        const chatHeader = document.getElementById('chatHeader');
        
        // Обновляем заголовок
        chatHeader.textContent = chatName;

        // Очищаем сообщения
        messagesContainer.innerHTML = '';

        // Загружаем сообщения
        if (this.messages[chatName]) {
            this.messages[chatName].forEach(msg => {
                this.addMessageToChat(msg.type, msg.text, msg.time, false);
            });
        }

        // Добавляем индикатор печати
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'typing-indicator';
        typingIndicator.id = 'typingIndicator';
        typingIndicator.innerHTML = `
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            ${chatName} печатает...
        `;
        messagesContainer.appendChild(typingIndicator);

        // Прокручиваем вниз
        this.scrollToBottom();
    }

    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput.value.trim();

        if (text === '') return;

        // Добавляем сообщение пользователя
        const time = this.getCurrentTime();
        this.addMessageToChat('user', text, time, true);
        messageInput.value = '';

        // Сохраняем в историю
        if (!this.messages[this.currentChat]) {
            this.messages[this.currentChat] = [];
        }
        this.messages[this.currentChat].push({ type: 'user', text, time });

        // Обновляем последнее сообщение в списке чатов
        this.updateLastMessage(this.currentChat, text, time);

        // Имитируем ответ
        this.simulateReply(text);
    }

    addMessageToChat(type, text, time, saveToHistory = false) {
        const messagesContainer = document.getElementById('messages');
        const typingIndicator = document.getElementById('typingIndicator');
        
        // Скрываем индикатор печати перед добавлением сообщения
        if (typingIndicator) {
            typingIndicator.classList.remove('visible');
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            ${text}
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageDiv);

        if (saveToHistory) {
            this.messages[this.currentChat].push({ type, text, time });
        }

        this.scrollToBottom();

        // Показываем анимацию появления
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    simulateReply(userMessage) {
        const typingIndicator = document.getElementById('typingIndicator');
        
        // Показываем индикатор печати
        if (typingIndicator) {
            setTimeout(() => {
                typingIndicator.classList.add('visible');
                this.scrollToBottom();
            }, 500);
        }

        // Генерируем ответ
        const replies = {
            'Гарант': [
                "Понял вас. Могу предложить несколько вариантов.",
                "Отличный выбор! Расскажу подробнее.",
                "Уточните, какой бюджет вас интересует?",
                "Есть подходящие варианты. Сейчас подберу лучший.",
                "Могу гарантировать безопасность сделки."
            ],
            'Алексей': [
                "Жду ваших предложений.",
                "Можем обсудить детали.",
                "Интересует скидка?",
                "Когда сможем завершить сделку?"
            ],
            'Мария': [
                "Рада была помочь! 😊",
                "Если будут вопросы - обращайтесь!",
                "Хорошего дня! 🌟"
            ]
        };

        const currentReplies = replies[this.currentChat] || ["Понял. Продолжим обсуждение."];
        const randomReply = currentReplies[Math.floor(Math.random() * currentReplies.length)];

        // Задержка перед ответом (имитация печати)
        setTimeout(() => {
            if (typingIndicator) {
                typingIndicator.classList.remove('visible');
            }
            
            const time = this.getCurrentTime();
            this.addMessageToChat('other', randomReply, time, true);
            
            // Обновляем последнее сообщение в списке чатов
            this.updateLastMessage(this.currentChat, randomReply, time);
        }, 2000 + Math.random() * 2000);
    }

    updateLastMessage(chatName, message, time) {
        const chatItem = document.querySelector(`.chat-item[data-name="${chatName}"]`);
        if (chatItem) {
            const lastMessageEl = chatItem.querySelector('.chat-last-message');
            const timeEl = chatItem.querySelector('.chat-time');
            
            if (lastMessageEl) {
                lastMessageEl.textContent = message;
            }
            if (timeEl && time) {
                timeEl.textContent = time;
            }
        }
    }

    filterChats(searchTerm) {
        const chatItems = document.querySelectorAll('.chat-item');
        const term = searchTerm.toLowerCase();

        chatItems.forEach(item => {
            const chatName = item.dataset.name.toLowerCase();
            const lastMessage = item.querySelector('.chat-last-message').textContent.toLowerCase();
            const isVisible = chatName.includes(term) || lastMessage.includes(term);
            item.style.display = isVisible ? 'flex' : 'none';
        });
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.getHours().toString().padStart(2, '0') + ':' + 
               now.getMinutes().toString().padStart(2, '0');
    }

    showTooltip(message) {
        // Простой тултип можно заменить на SweetAlert2
        console.log(message);
    }
}

// Инициализация чата когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new Chat();
});

// Обработчик ресайза для мобильного меню
window.addEventListener('resize', () => {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});