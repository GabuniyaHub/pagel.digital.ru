// import platforms from '../../../server/config/market/platforms.js';
import { getPublicData } from './getDataPublic.js';

// function upListing(listingId, token) {
//     fetch(`/market/listings/${listingId}/up`, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ listingId })
//     })
//     .then(async res => {
//         const data = await res.json();

//         if (!res.ok) { 
//             // Ошибка (например, 400)
//             Swal.fire({
//                 icon: 'error',
//                 title: 'Ошибка',
//                 text: data.message || 'Не удалось поднять объявление'
//             });
//             throw new Error(data.message || 'Request failed');
//         }

//         // Успех
//         Swal.fire({
//             icon: 'success',
//             title: 'Успешно',
//             text: 'Объявление поднято!'
//         }).then(() => {
//             // location.reload();
//         });
//     })
//     .catch(err => console.error('Error UP listing:', err));
// }


// function deleteListing(token, listingId) {
//     fetch(`/market/listings/${listingId}/delete`, {
//         method: 'DELETE',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${token}`
//         },
//         body: JSON.stringify({ listingId })
//     })
//     .then(async res => {
//         const data = await res.json();

//         if (!res.ok) {
//             Swal.fire({
//                 icon: 'error',
//                 title: 'Ошибка',
//                 text: data.message || 'Не удалось удалить объявление'
//             });
//             throw new Error(data.message || 'Request failed');
//         }

//         Swal.fire({
//             icon: 'success',
//             title: 'Успешно',
//             text: 'Объявление удалено!'
//         }).then(() => {
//             location.reload();
//         });
//     })
//     .catch(err => console.error('Error deleting listing:', err));
// }



document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await getPublicData();
    if (!data) throw new Error('Нет данных для отображения');
    // console.log('Данные загружены:', data);

    // Подставляем данные пользователя
    const user = data.user;
    const listings = data.listings;
    const reviews = data.reviews;
    const favorites = data.favorites;
    const categories = data.categories;
    const platforms = data.platforms;

    // Приветственное сообщение
    // const welcomeMessage = document.querySelector('.welcome p strong');
    // if (welcomeMessage) {
    //   welcomeMessage.textContent = user.nickname || '';
    // }

    const titlePage = document.getElementById('title-page');
    if (titlePage) {
        titlePage.textContent = user.nickname || 'Публичный профиль';
    }

    // Профиль
    const profileImg = document.querySelector('.profile-img');
    if (profileImg) profileImg.src = user.avatar || 'market/uploads/avatars/default/orangeDefA.png'; 

    const profileName = document.querySelector('.profile-name');
    if (profileName) profileName.textContent = user.nickname;

    // Бейджи
    // verified badge
    const buttonVerify = document.querySelector('.badge-verified');
    if (buttonVerify) {
      buttonVerify.style.display = user.verified ? 'flex' : 'none';
    }

    // premium badge
    const buttonPremium = document.querySelector('.badge-premium');
    if (buttonPremium) {
        buttonPremium.style.display = user.is_premium ? 'flex' : 'none';
    }

    // Описание профиля
    const profileDescription = document.querySelector('.profile-desc');
    if (profileDescription) profileDescription.textContent = user.description || 'Начинающий продавец';

    // Статистика
    const stats = document.querySelectorAll('.stats .stat span');
    if (stats.length >= 4) {
      stats[0].textContent = user.rating.toFixed(1);     // Рейтинг
      stats[1].textContent = reviews.length;             // Отзывы
      stats[2].textContent = '0';                        // Сделки
      stats[3].textContent = listings.length;            // Объявления
    }

    // отзывы

    // Предположим, что data.reviews — это массив отзывов
    const reviewsContainer = document.getElementById('reviews');

    // очищаем контейнер, если там что-то уже есть
    reviewsContainer.innerHTML = '';

    // проверяем, есть ли отзывы
    if (data.reviews && data.reviews.length > 0) {
    data.reviews.forEach(review => {
        const reviewDiv = document.createElement('div');
        reviewDiv.classList.add('review');
        reviewDiv.innerHTML = `<strong>${review.author}</strong> ${review.text}`;
        reviewsContainer.appendChild(reviewDiv);
    });
    } else {
    const noReviews = document.createElement('div');
    noReviews.classList.add('review');
    noReviews.textContent = 'Отзывов пока нет.';
    reviewsContainer.appendChild(noReviews);
    }

    // сделки 
    const dealsContainer = document.getElementById('deals');
    dealsContainer.innerHTML = '';

    if (data.deals && data.deals.length > 0) {
    data.deals.forEach(deal => {
        const dealDiv = document.createElement('div');
        dealDiv.classList.add('deal');
        dealDiv.innerHTML = `
        <strong>${deal.title}</strong>
        Сумма: ${deal.amount} $ — ${deal.status}
        `;
        dealsContainer.appendChild(dealDiv);
    });
    } else {
    const noDeals = document.createElement('div');
    noDeals.classList.add('deal');
    noDeals.textContent = 'Сделок пока нет.';
    dealsContainer.appendChild(noDeals);
    }

    // объявления 

    const adsContainer = document.getElementById('ads');
    adsContainer.innerHTML = '';

    if (data.listings && data.listings.length > 0) {
        for (const listing of data.listings) {
            const adDiv = document.createElement('div');
            adDiv.classList.add('ad');

            // текущий listing
            // console.log('Текущий listing:', listing);

            // парсим
            const categoryID = listing.category_id;

            // 1. Находим нужную категорию по categoryID
            const category = categories.find(c => c.id === categoryID);


            // 2. Если категория найдена, получаем её platform_id
            if (!category) {
                console.error(`Категория с ID ${categoryID} не найдена для объявления ${listing.name}`);
                continue; // Пропускаем этот listing, если категория не найдена
            }

            // категория текущего объявления
            // console.log('Категория объявления:', category.name);

            
            const platformID = category.platform_id;

            // 3. Находим платформу по platformID
            const platform = platforms.find(p => p.id === platformID);

            // 4. Если платформа найдена, получаем её slug
            if (!platform) {
                console.error(`Платформа с ID ${platformID} не найдена для категории ${category.name}`);
                continue; // Пропускаем этот listing, если платформа не найдена
            }

            const platformSlug = platform.slug; // Получаем slug платформы
            let parsingData = null;
            let url = null;

            if (listing.link) {
              try { 
                  // Если ссылка на платформу есть, используем её
                  url = listing.link;
                  
                  const res = await fetch(`/market/avatar?url=${encodeURIComponent(url)}&platform=${encodeURIComponent(platformSlug)}`);
                  
                  if (!res.ok) throw new Error('Ошибка при получении платформы');
                  
                  
                  parsingData = await res.json();
                  
                //   console.log('Данные для парсинга:', parsingData);
              } catch (error) { 
                  console.error('Ошибка при получении платформы:', error); 
              }
            }

            let subscribers = null;
            if (listing.subscribers) {
                subscribers = listing.subscribers + ' подписчиков';
            } else if (parsingData?.subscribers) {
                subscribers = parsingData.subscribers + ' подписчиков';
            } else {
                subscribers = 'Без подписчиков';
            }

            const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');

            adDiv.innerHTML = `
            <img src="${listing.cover ? `/market/uploads/${listing.cover}` : parsingData.avatar}" alt="ava" class="ad-avatar">
            <div class="ad-info">
                <strong>${listing.name ? listing.name : parsingData.title || 'Без названия' }</strong>
                <div>${subscribers}</div>
                <div>Цена: ${listing.price} $</div>
            </div>
            <div class="ad-actions">
                <button class="btn-edit" data-id="${listing.id}">перейти</button>
            </div>
            `;
            adsContainer.appendChild(adDiv);

            adsContainer.addEventListener("click", (e) => {
                // if (e.target.classList.contains("btn-up")) {
                //     upListing(e.target.dataset.id, token);
                // }

                // if (e.target.classList.contains("btn-delete")) {
                //     const listingId = e.target.dataset.id;

                //     Swal.fire({
                //         title: 'Вы уверены?',
                //         text: 'Это действие необратимо. Объявление будет удалено.',
                //         icon: 'warning',
                //         showCancelButton: true,
                //         confirmButtonColor: '#d33',
                //         cancelButtonColor: '#3085d6',
                //         confirmButtonText: 'Да, удалить',
                //         cancelButtonText: 'Отмена'
                //     }).then((result) => {
                //         if (result.isConfirmed) {
                //             deleteListing(token, listingId);
                //         }
                //     });
                // }

                if (e.target.classList.contains("btn-edit")) {
                    const listingIdToEdit = parseInt(e.target.dataset.id, 10);
                    
                    // Ищем текущее объявление по id
                    const currentListing = listings.find(item => item.id === listingIdToEdit);
                    if (!currentListing) {
                        console.error(`Объявление с ID ${listingIdToEdit} не найдено`);
                        return;
                    }

                    // 1. Получаем category_id объявления
                    const listingCategoryId = currentListing.category_id;

                    // 2. Ищем категорию
                    const listingCategory = categories.find(cat => cat.id === listingCategoryId);
                    if (!listingCategory) {
                        console.error(`Категория с ID ${listingCategoryId} не найдена`);
                        return;
                    }

                     // 3. Ищем платформу по platform_id категории
                    const listingPlatform = platforms.find(pl => pl.id === listingCategory.platform_id);
                    if (!listingPlatform) {
                        console.error(`Платформа с ID ${listingCategory.platform_id} не найдена`);
                        return;
                    }

                    // 4. Формируем корректный URL
                    window.location.href = `/market/${listingPlatform.slug}/${listingCategory.name}/items/${listingIdToEdit}`;
                }
            });
        }
    } else {
        const noAds = document.createElement('div');
        noAds.classList.add('ad');
        noAds.textContent = 'Объявлений пока нет.';
        adsContainer.appendChild(noAds);
    }

    // контакты
    const contactsContainer = document.getElementById('contacts');
    contactsContainer.innerHTML = '';

    const contacts = user.contacts;

    const icons = {
        vk: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/vk.svg',
        telegram: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/telegram.svg',
        whatsapp: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg',
        instagram: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg',
        email: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg'
    };

    if (contacts && Object.keys(contacts).length > 0) {
        let hasContact = false;

        for (const [type, value] of Object.entries(contacts)) {
            if (value) {
                const contactDiv = document.createElement('div');
                contactDiv.classList.add('contact');
                
                // Подготовка ссылки для Telegram, если указано как @username
                let href = value;
                if (type === 'telegram' && value.startsWith('@')) {
                    href = `https://t.me/${value.slice(1)}`;
                } else if (type === 'email') {
                    href = `mailto:${value}`;
                }

                contactDiv.innerHTML = `
                    <img src="${icons[type]}" alt="${type} icon" width="24" height="24">
                    <strong>${type}</strong>
                    <a class="button" href="${href}" target="_blank">Связаться</a>
                `;
                contactsContainer.appendChild(contactDiv);
                hasContact = true;
            }
        }

        
        if (!hasContact) {
            const noContacts = document.createElement('div');
            noContacts.classList.add('contact');
            noContacts.textContent = 'Продавец не указал контакты';
            contactsContainer.appendChild(noContacts);
        }

    } else {
        const noContacts = document.createElement('div');
        noContacts.classList.add('contact');
        noContacts.textContent = 'Продавец не указал контакты';
        contactsContainer.appendChild(noContacts);
    }


  } catch (err) {
    console.error('Ошибка при получении данных:', err);
  }
});
