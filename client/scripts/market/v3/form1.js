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

    function updatePreview() {
        previewList.innerHTML = '';
        if (filesArray.length === 0) {
            dropText.style.display = '';
        } else {
            dropText.style.display = 'none';
        }
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
                e.stopPropagation(); 
                filesArray.splice(idx, 1);
                updatePreview();
            };

            item.appendChild(img);
            item.appendChild(removeBtn);
            previewList.appendChild(item);
        });
        
    }

    function addFiles(newFiles) {
        let allowed = MAX_SCREENSHOTS - filesArray.length;
        if (newFiles.length > allowed) {
            alert(`Максимум ${MAX_SCREENSHOTS} скриншотов!`);
            newFiles = newFiles.slice(0, allowed);
        }
        filesArray = filesArray.concat(newFiles);
        updatePreview();
        // console.log("filesArray:", filesArray)
    }

    // Drag & Drop events
    dropArea.addEventListener('click', (event) => { if (event.target !== fileInput) fileInput.click(); });
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

    // Получение кода подтверждения с сервера и вставка в блок
    async function fetchOwnershipCode() {
        try {
            // Замените URL на свой реальный эндпоинт
            const res = await fetch('/market/ownership-code', { method: 'POST' });
            if (!res.ok) throw new Error('Ошибка получения кода');
            const data = await res.json();
            return data.code; // предполагается, что сервер возвращает { code: "..." }
        } catch (err) {
            return 'Ошибка загрузки кода';
        }
    }

    // Вставка кода в блок
    const codeBlock = document.getElementById('ownership-code');
    if (codeBlock) {
        fetchOwnershipCode().then(code => {
            codeBlock.textContent = code;
        });
    }


    
});
