async function handleCredentialResponse(response) {
  const currentTime = Math.floor(Date.now() / 1000);

  if (response.exp && currentTime > response.exp) {
      console.error('Токен истёк, запрашиваем новый...');
      google.accounts.id.prompt(); // Запрашиваем новый токен
      return;
  }

 

  try {
      // Отправляем токен на сервер
      const serverResponse = await fetch('/auth/google', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ credential: response.credential }),
      });

      // Парсим JSON-ответ
      const data = await serverResponse.json();

      if (data.success) {
          // Сохраняем токен и данные пользователя в зависимости от состояния чекбокса
          const rememberMe = document.getElementById('rememberMe').checked;

          if (rememberMe) {
              localStorage.setItem('jwt', data.token);
              localStorage.setItem('user', JSON.stringify(data.user));
              document.cookie = `jwt=${data.token}; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 30}`;
          } else {
              sessionStorage.setItem('jwt', data.token);
              sessionStorage.setItem('user', JSON.stringify(data.user));
              document.cookie = `jwt=${data.token}; path=/; SameSite=Lax`;
          }

          // Перенаправляем пользователя
          window.location.href = '../../../pages/index.html';
      } else {
          Swal.fire("Ошибка", data.message, "error");
      }
  } catch (error) {
      console.error('Ошибка:', error);
      Swal.fire("Ошибка", "Произошла ошибка. Попробуйте позже.", "error");
  }
}
  
  window.onload = function () {
    google.accounts.id.initialize({
      client_id: '293649929067-v7prhbomfisdih5868evj6e66p6r42em.apps.googleusercontent.com', // Ваш Client ID
      callback: handleCredentialResponse,
    });
  
    google.accounts.id.renderButton(
      document.getElementById('googleSignInButton'),
       {
        theme: 'outline', // Тема: outline или filled
        size: 'large',    // Размер: small, medium, large
        text: 'signin_with', // Текст: signin_with или signup_with
        shape: 'rectangular',
        width: '100%',
       }
    );
  };
