// Shared by catalog routes and the listing composer. Names match stored categories.
module.exports = [
    { id: 'channel-buy', name: 'Купить канал', description: 'Продажа YouTube-канала', formType: 1 },
    { id: 'channel-sell', name: 'Продать канал', description: 'Продать канал', navigationOnly: true },
    { id: 'promotion', name: 'Продвижение', description: 'Продвижение и просмотры', formType: 2 },
    { id: 'editing', name: 'Монтаж', description: 'Монтаж видео', formType: 2 },
    { id: 'design', name: 'Дизайн', description: 'Дизайн и превью', formType: 2 },
    { id: 'content', name: 'Контент', description: 'Сценарии и контент', formType: 2 },
    { id: 'voiceover', name: 'Озвучка', description: 'Озвучка', formType: 2 },
    { id: 'other-services', name: 'Другие услуги', description: 'Другие YouTube-услуги', formType: 2 },
    { id: 'become-executor', name: 'Исполнитель', description: 'Услуги исполнителя', formType: 2 },
    { id: 'analytics', name: 'Аналитика', description: 'Аналитика', formType: 2 },
    { id: 'content-under-key', name: 'Контент под ключ', description: 'Контент под ключ', formType: 2 },
    { id: 'audience-growth', name: 'Рост аудитории', description: 'Рост аудитории', formType: 2 }
];
