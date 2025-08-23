document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('listing-search-form');
    const listingsDiv = document.querySelector('.listings');
    const allListings = Array.from(listingsDiv.children);

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Валидация
        let valid = true;
        form.querySelectorAll('input[type="number"]').forEach(input => {
            if (input.value && Number(input.value) < 0) {
                input.style.borderColor = 'red';
                valid = false;
            } else {
                input.style.borderColor = '';
            }
        });

        // Дополнительная валидация: min <= max для price, subs, income
        const pairs = [
            {min: 'price_min', max: 'price_max'},
            {min: 'subs_min', max: 'subs_max'},
            {min: 'income_min', max: 'income_max'}
        ];
        pairs.forEach(pair => {
            const min = Number(form[pair.min].value);
            const max = Number(form[pair.max].value);
            if (form[pair.min].value && form[pair.max].value && min > max) {
                form[pair.min].style.borderColor = 'red';
                form[pair.max].style.borderColor = 'red';
                valid = false;
            }
        });

        if (!valid) return;

        // Получаем значения фильтров
        const q = form.q.value.trim().toLowerCase();
        const priceMin = Number(form.price_min.value) || 0;
        const priceMax = Number(form.price_max.value) || Infinity;
        const subsMin = Number(form.subs_min.value) || 0;
        const subsMax = Number(form.subs_max.value) || Infinity;
        const monetized = form.monetized.value;
        const incomeMin = Number(form.income_min.value) || 0;
        const incomeMax = Number(form.income_max.value) || Infinity;
        const theme = form.theme.value;

        console.log(monetized);
        
        // Фильтрация
        listingsDiv.innerHTML = '';
        let found = false;
        allListings.forEach(card => {
            const title = card.querySelector('.listing-title')?.textContent?.toLowerCase() || '';
            const price = Number(card.dataset.price) || 0;
            const subs = Number(card.dataset.subs) || 0;
            const income = Number(card.dataset.income) || 0;
            const cardMonetized = card.dataset.monetized || '';
            const cardTheme = card.dataset.theme || '';

            console.log(cardMonetized);

            let show = true;
            if (q && !title.includes(q)) show = false;
            if (price < priceMin || price > priceMax) show = false;
            if (subs < subsMin || subs > subsMax) show = false;
            if (income < incomeMin || income > incomeMax) show = false;
            if (monetized && cardMonetized !== monetized) show = false;
            if (theme && cardTheme !== theme) show = false;

            if (show) {
                listingsDiv.appendChild(card);
                found = true;
            }
        });
        if (!found) {
            listingsDiv.innerHTML = '<p>Нет доступных товаров по выбранным фильтрам.</p>';
        }
    });

    // Сброс фильтра
    form.addEventListener('reset', function() {
        setTimeout(() => {
            listingsDiv.innerHTML = '';
            allListings.forEach(card => listingsDiv.appendChild(card));
            form.querySelectorAll('input').forEach(input => input.style.borderColor = '');
        }, 0);
    });
});