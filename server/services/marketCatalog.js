const themes = ['Авто', 'Бизнес', 'Дизайн', 'Животные', 'ЖЦА 30+', 'Здоровье', 'Знакомство и общение', 'Игры', 'IT', 'Культура', 'Кино', 'Кулинария', 'Литература', 'Мода и красота', 'Молодёжные до 18', 'МЦА 30+', 'Наука и факты', 'Недвижимость', 'Новости и СМИ', 'Образование', 'Объявления', 'Политика', 'Природа', 'Психология', 'Развлечения', 'Региональные порталы', 'Религия', 'Ремонт', 'Работа', 'Семья', 'Спорт', 'Товары и услуги', 'Туризм', 'Фото', 'Хобби', 'Эзотерика', 'Эротика', 'Юмор', 'Другое', 'Фан-группы', 'Крипта / NFT'];

function catalogQuery(query, platform, category, isChannel) {
    const scalar = key => typeof query[key] === 'string' ? query[key].trim() : '';
    const filters = { q: scalar('q').slice(0, 120), sort: scalar('sort') || 'recommended' };
    const errors = [];
    const params = [platform, category];
    const conditions = ['p.slug = $1', 'c.name = $2', 'COALESCE(l.is_blocked, false) = false', 'COALESCE(u.is_blocked, false) = false'];
    function condition(sql, value) {
        params.push(value);
        conditions.push(sql.replaceAll('?', '$' + params.length));
    }
    if (filters.q) condition('(l.name ILIKE ? OR l.description ILIKE ?)', '%' + filters.q + '%');
    const ranges = [{ prefix: 'price', column: 'price', label: 'Цена' }];
    if (isChannel) ranges.push({ prefix: 'subs', column: 'subscribers', label: 'Подписчики' }, { prefix: 'income', column: 'income', label: 'Доход' });
    for (const {prefix, column, label} of ranges) {
        for (const bound of ['min', 'max']) {
            const key = prefix + '_' + bound;
            filters[key] = scalar(key);
            if (!filters[key]) continue;
            const number = Number(filters[key]);
            if (!/^\d+(\.\d{1,2})?$/.test(filters[key]) || !Number.isFinite(number) || number < 0 || number > Number.MAX_SAFE_INTEGER || (prefix === 'subs' && !Number.isInteger(number))) {
                errors.push(label + ': укажите корректное неотрицательное число.');
                continue;
            }
            condition('l.' + column + (bound === 'min' ? ' >= ?' : ' <= ?'), number);
        }
        if (filters[prefix + '_min'] && filters[prefix + '_max'] && Number(filters[prefix + '_min']) > Number(filters[prefix + '_max'])) errors.push(label + ': значение «от» не должно превышать «до».');
    }
    if (isChannel) {
        filters.theme = scalar('theme');
        filters.monetized = scalar('monetized');
        if (filters.theme && themes[Number(filters.theme) - 1]) condition('l.theme = ?', filters.theme);
        else filters.theme = '';
        if (['true', 'false'].includes(filters.monetized)) condition('l.monetization = ?', filters.monetized === 'true');
        else filters.monetized = '';
    }
    const sorts = {
        recommended: 'u.is_premium DESC NULLS LAST, (l.is_pinned AND l.pin_expiration_date > NOW()) DESC NULLS LAST, l.position ASC, l.id DESC',
        newest: 'l.created_at DESC, l.id DESC',
        price_asc: 'l.price ASC NULLS LAST, l.id DESC',
        price_desc: 'l.price DESC NULLS LAST, l.id DESC'
    };
    if (isChannel) sorts.subscribers_desc = 'l.subscribers DESC NULLS LAST, l.id DESC';
    if (!Object.hasOwn(sorts, filters.sort)) filters.sort = 'recommended';
    const page = Math.min(100000, Math.max(1, parseInt(scalar('page'), 10) || 1));
    const pageSize = 24;
    const from = 'FROM listings l JOIN categories c ON l.category_id = c.id JOIN platforms p ON c.platform_id = p.id JOIN users u ON l.user_id = u.id WHERE ' + conditions.join(' AND ');
    return {
        filters, errors, page, pageSize,
        countSql: 'SELECT COUNT(*) ' + from,
        countParams: [...params],
        sql: 'SELECT l.*, p.slug AS platform_slug, u.nickname AS seller_name, u.avatar AS seller_avatar, u.is_premium, u.verified, (l.is_pinned AND l.pin_expiration_date > NOW()) AS is_pinned_active ' + from + ' ORDER BY ' + sorts[filters.sort] + ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2),
        params: [...params, pageSize, (page - 1) * pageSize]
    };
}
module.exports = { catalogQuery, themes };
