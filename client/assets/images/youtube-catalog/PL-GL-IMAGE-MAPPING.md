# PL-GL YouTube Catalog — Image Mapping

Папка назначения:
`../assets/images/youtube-catalog/`

## Hero

`10-youtube-hero-banner.png`

Использовать в `.catalog-hero` как главный баннер.

Пример:
```html
<img src="../assets/images/youtube-catalog/10-youtube-hero-banner.png"
     alt="PL-GL — Всё для YouTube"
     class="catalog-hero-image">
```

## Карточки 01–09

Заменить старый `<span class="catalog-number">01</span>` на изображение.

| Старый номер | Карточка | Файл |
|---|---|---|
| 01 | Купить YouTube-канал | `01-youtube-channel-buy.png` |
| 02 | Продать YouTube-канал | `02-youtube-channel-sell.png` |
| 03 | Продвижение и просмотры | `03-youtube-promotion.png` |
| 04 | Монтаж видео | `04-youtube-editing.png` |
| 05 | Дизайн и превью | `05-youtube-design.png` |
| 06 | Сценарии и контент | `06-youtube-content.png` |
| 07 | Озвучка | `07-youtube-voiceover.png` |
| 08 | Другие YouTube-услуги | `08-youtube-services.png` |
| 09 | Стать исполнителем | `09-youtube-provider.png` |

Рекомендуемый класс:
```html
<img src="../assets/images/youtube-catalog/01-youtube-channel-buy.png"
     alt=""
     class="catalog-card-image">
```

```css
.catalog-card-image {
    width: 110px;
    height: 78px;
    object-fit: cover;
    border-radius: 14px;
    flex-shrink: 0;
}
```

## Дополнительные A1–A3

| Старый код | Карточка | Файл |
|---|---|---|
| A1 | Аналитика канала | `11-youtube-analytics.png` |
| A2 | Контент под ключ | `12-youtube-content-under-key.png` |
| A3 | Работа с аудиторией | `13-youtube-audience-growth.png` |

Их также использовать вместо `.catalog-number`.

## Важно

- НЕ менять существующие `href`.
- НЕ менять IDs.
- НЕ менять JS и интеграции.
- НЕ удалять поиск, аккаунт, настройки или избранное.
- НЕ использовать старый planet.png.
- Логотип остаётся `../assets/images/pl-gl-logo.svg`.
- Новые изображения находятся в `../assets/images/youtube-catalog/`.
- Изображения заменяют только визуальные номера/буквы.
