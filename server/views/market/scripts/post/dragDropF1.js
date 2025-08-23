document.addEventListener('DOMContentLoaded', () => {
    // ...твой другой код...

    // Drag & Drop + preview
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('screenshots');
    const previewList = document.getElementById('preview-list');
    const dropText = document.getElementById('drop-area-text');
    const flexSwitch = document.getElementById('flex_switch'); // чекбокс "Я соглашаюсь..."

    const MAX_SCREENSHOTS = 12;
    window.filesArray = [];
    window.existingScreenshots = [];

    function updatePreview() {
        previewList.innerHTML = '';

        const totalScreenshots = existingScreenshots.length + filesArray.length;
        dropText.style.display = totalScreenshots === 0 ? '' : 'none';

        // Сначала старые (из базы)
        existingScreenshots.forEach((filename, idx) => {
            const item = document.createElement('div');
            item.className = 'preview-item';

            const img = document.createElement('img');
            img.className = 'preview-img';
            img.src = `/market/uploads/${filename}`;
            img.alt = filename;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.type = 'button';
            removeBtn.textContent = 'Удалить';
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // <-- добавь это!
                existingScreenshots.splice(idx, 1);
                updatePreview();
            };

            item.appendChild(img);
            item.appendChild(removeBtn);
            previewList.appendChild(item);
        });

        // Затем новые (те, что только что добавлены)
        filesArray.forEach((file, idx) => {
            const item = document.createElement('div');
            item.className = 'preview-item';

            const img = document.createElement('img');
            img.className = 'preview-img';
            img.src = URL.createObjectURL(file);
            img.alt = file.name;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.type = 'button';
            removeBtn.textContent = 'Удалить';
            removeBtn.onclick = (e) => {
                e.stopPropagation(); // <-- добавь это!
                existingScreenshots.splice(idx, 1);
                updatePreview();
            };

            item.appendChild(img);
            item.appendChild(removeBtn);
            previewList.appendChild(item);
        });
    }

    window.updatePreview = updatePreview;


    function addFiles(newFiles) {
        let allowed = MAX_SCREENSHOTS - filesArray.length;
        if (newFiles.length > allowed) {
            Swal.fire({
                icon: 'warning',
                title: 'Лимит скриншотов',
                text: `Максимум ${MAX_SCREENSHOTS} скриншотов!`,
                confirmButtonText: 'Ок'
            });
            newFiles = newFiles.slice(0, allowed);
        }
        filesArray = filesArray.concat(newFiles);
        updatePreview();
        // console.log("filesArray:", filesArray)
    }

    // Drag & Drop events
    dropArea.addEventListener('click', () => fileInput.click());
    dropArea.addEventListener('dragover', e => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    dropArea.addEventListener('dragleave', e => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
    });
    dropArea.addEventListener('drop', e => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        let files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
    });

    fileInput.addEventListener('change', e => {
        let files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        addFiles(files);
        fileInput.value = ''; // чтобы можно было выбрать тот же файл снова
    });
});
