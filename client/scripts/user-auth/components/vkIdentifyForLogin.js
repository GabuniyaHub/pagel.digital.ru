// 3.1. Обработка успешного входа (аналог handleCredentialResponse для Google)
async function handleVKSignIn(data) {
  try {
    // Отправка данных на сервер (аналогично Google)
    const serverResponse = await fetch('http://localhost:3000/auth/vk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.access_token,
        email: data.email,
        user_id: data.user_id
      }),
    });

    const responseData = await serverResponse.json();

    if (responseData.success) {
      // Сохранение токена и перенаправление (как у Google)
      const rememberMe = document.getElementById('rememberMe').checked;
      
      if (rememberMe) {
        localStorage.setItem('jwt', responseData.token);
        localStorage.setItem('user', JSON.stringify(responseData.user));
      } else {
        sessionStorage.setItem('jwt', responseData.token);
        sessionStorage.setItem('user', JSON.stringify(responseData.user));
      }

      window.location.href = '../../../pages/index.html';
    } else {
      Swal.fire("Ошибка", responseData.message, "error");
    }
  } catch (error) {
    console.error('Ошибка:', error);
    Swal.fire("Ошибка", "Произошла ошибка. Попробуйте позже.", "error");
  }
}

// 3.2. Инициализация VK ID (аналог window.onload для Google)
document.addEventListener('DOMContentLoaded', function() {
  if ('VKIDSDK' in window) {
    const VKID = window.VKIDSDK;

    // Настройка VK ID (как Config в Google)
    VKID.Config.init({
      app: 53720636, // Ваш app_id
      redirectUrl: 'http://localhost:3000/',
      scope: 'email', // Запрашиваем email
    });

    // Создаем кнопку (аналог renderButton у Google)
    const oneTap = new VKID.OneTap();
    oneTap.render({
      container: document.getElementById('vkid-button-container'),
      showAlternativeLogin: true,
      skin: 'secondary',
      styles: {
          width: 235,
          height: 36
      },
      oauthList: [
          'mail_ru',
          'ok_ru'
        ]
    });

    // Обработка успешного входа
    oneTap.on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
      const { code, device_id } = payload;

      // Обмен кода на токен (этого нет в Google)
      const authData = await VKID.Auth.exchangeCode(code, device_id);

      // Получение данных пользователя (аналог декодирования JWT у Google)
      const userInfo = await VKID.API.usersGet({
        access_token: authData.access_token,
        fields: ['photo_100', 'email']
      });

      // Вызываем наш обработчик
      await handleVKSignIn({
        access_token: authData.access_token,
        email: authData.email,
        user_id: authData.user_id,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        photo: userInfo.photo_100
      });
    });

    // Обработка ошибок
    oneTap.on(VKID.WidgetEvents.ERROR, (error) => {
      Swal.fire("Ошибка VK", "Не удалось войти", "error");
    });
  }
});