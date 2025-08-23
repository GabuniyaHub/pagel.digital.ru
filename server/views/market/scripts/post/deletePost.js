function deleteListing(id) {
  const token = sessionStorage.getItem("jwt") || localStorage.getItem("jwt");

  Swal.fire({
    title: 'Вы уверены?',
    text: 'Удалить объявление?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Да, удалить',
    cancelButtonText: 'Отмена'
  }).then((result) => {
    if (!result.isConfirmed) return;

    fetch(`/market/listings/${id}/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    })
    .then(res => {
      if (res.ok) {
        Swal.fire({
          title: 'Удалено!',
          text: 'Объявление успешно удалено.',
          icon: 'success',
          confirmButtonText: 'Ок'
        }).then(() => {
          location.href = '/';
        });
      } else {
        res.json().then(data => {
          Swal.fire({
            title: 'Ошибка',
            text: data.message || 'Не удалось удалить объявление.',
            icon: 'error',
            confirmButtonText: 'Ок'
          });
        });
      }
    })
    .catch(err => {
      Swal.fire({
        title: 'Ошибка',
        text: 'Что-то пошло не так при удалении.',
        icon: 'error',
        confirmButtonText: 'Ок'
      });
      console.error(err);
    });
  });
}
