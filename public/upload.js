document.addEventListener('DOMContentLoaded', () => {
  // Pobierz elementy
  const bulkForm = document.getElementById('bulkUploadForm');
  const wishForm = document.getElementById('wishUploadForm');
  const bulkBtn = bulkForm.querySelector('button[type="submit"]');
  const wishBtn = wishForm.querySelector('button[type="submit"]');
  const photoInput = document.getElementById('photoInput');
  const wishInput = document.getElementById('wishInput');
  const wishMessage = document.getElementById('wishMessage');
  const statusEl = document.getElementById('status');
  const bulkPreviewContainer = document.getElementById('bulkPreviewContainer');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');

  // Reset stanu na starcie
  photoInput.value = '';
  wishInput.value = '';
  wishMessage.value = '';
  document.getElementById('charCount').textContent = '0';
  bulkPreviewContainer.innerHTML = '';
  bulkPreviewContainer.style.display = 'none';
  previewContainer.style.display = 'none';
  previewImg.src = '';

  // Inicjalizuj przyciski
  bulkBtn.disabled = true;
  wishBtn.disabled = true;

  // Tablica wybranych plików dla bulk upload
  let selectedFiles = [];
  // Pojedynczy plik dla życzeń
  let selectedWishFile = null;

  // WALIDACJA + PODGLĄD BULK UPLOAD
  photoInput.addEventListener('change', (e) => {
    selectedFiles = Array.from(e.target.files || []);
    renderBulkPreview();
    validateBulkButton();
  });

  function renderBulkPreview() {
    bulkPreviewContainer.innerHTML = '';

    if (selectedFiles.length === 0) {
      bulkPreviewContainer.style.display = 'none';
      return;
    }

    bulkPreviewContainer.style.display = 'flex';

    selectedFiles.forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';

      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.style.width = '80px';
      img.style.height = '80px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '✕';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '-8px';
      removeBtn.style.right = '-8px';
      removeBtn.style.width = '22px';
      removeBtn.style.height = '22px';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.border = 'none';
      removeBtn.style.background = '#dc3545';
      removeBtn.style.color = 'white';
      removeBtn.style.fontSize = '14px';
      removeBtn.style.display = 'flex';
      removeBtn.style.alignItems = 'center';
      removeBtn.style.justifyContent = 'center';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      removeBtn.style.padding = '0';
      removeBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderBulkPreview();
        validateBulkButton();
      });

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      bulkPreviewContainer.appendChild(wrapper);
    });
  }

  function validateBulkButton() {
    const fileCount = selectedFiles.length;
    const hasFiles = fileCount > 0;
    const tooManyFiles = fileCount > 10;

    if (tooManyFiles) {
      alert(`⚠️ Maksymalnie 10 zdjęć!\nWybrano: ${fileCount}\nPonownie wybierz zdjęcia lub usuń część.`);
      statusEl.textContent = '⚠️ Wybierz maksymalnie 10 zdjęć';
      bulkBtn.disabled = true;
      bulkBtn.style.opacity = '0.5';
      return;
    }

    if (hasFiles) {
      let photosText = '';
      if (fileCount === 1) {
        photosText = '1 zdjęcie';
      } else if (fileCount % 10 >= 2 && fileCount % 10 <= 4 && (fileCount < 10 || fileCount > 20)) {
        photosText = `${fileCount} zdjęcia`;
      } else {
        photosText = `${fileCount} zdjęć`;
      }
      statusEl.textContent = `✅ Gotowe: ${photosText}`;
      bulkBtn.disabled = false;
      bulkBtn.style.opacity = '1';
    } else {
      statusEl.textContent = '';
      bulkBtn.disabled = true;
      bulkBtn.style.opacity = '0.5';
      bulkPreviewContainer.style.display = 'none';
    }
  }

  // BULK UPLOAD - wysyłanie selectedFiles
  bulkForm.onsubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      statusEl.textContent = 'Najpierw wybierz zdjęcia.';
      return;
    }

    statusEl.textContent = 'Przesyłanie...';

    for (let file of selectedFiles) {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        statusEl.textContent = 'Błąd: ' + (await res.text());
        return;
      }
    }

    // Reset stanu po wysłaniu
    selectedFiles = [];
    photoInput.value = '';
    bulkPreviewContainer.innerHTML = '';
    bulkPreviewContainer.style.display = 'none';

    statusEl.innerHTML = '✅ Zdjęcia przesłane pomyślnie!';
    bulkBtn.disabled = true;
    bulkBtn.style.opacity = '0.5';
  };

  // WALIDACJA ŻYCZEŃ
  wishInput.addEventListener('change', () => {
    selectedWishFile = wishInput.files[0] || null;
    renderWishPreview();
    toggleWishBtn();
  });
  wishMessage.addEventListener('input', toggleWishBtn);

  function renderWishPreview() {
    // Usuń stary krzyżyk, jeśli jest
    const oldRemoveBtn = previewContainer.querySelector('.wish-remove-btn');
    if (oldRemoveBtn) oldRemoveBtn.remove();

    if (selectedWishFile) {
      previewImg.src = URL.createObjectURL(selectedWishFile);
      previewContainer.style.display = 'block';

      // Dodaj krzyżyk do usuwania
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'wish-remove-btn';
      removeBtn.textContent = '✕';
      removeBtn.style.position = 'absolute';
      removeBtn.style.top = '-8px';
      removeBtn.style.right = '-8px';
      removeBtn.style.width = '22px';
      removeBtn.style.height = '22px';
      removeBtn.style.borderRadius = '50%';
      removeBtn.style.border = 'none';
      removeBtn.style.background = '#dc3545';
      removeBtn.style.color = 'white';
      removeBtn.style.fontSize = '14px';
      removeBtn.style.display = 'flex';
      removeBtn.style.alignItems = 'center';
      removeBtn.style.justifyContent = 'center';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      removeBtn.style.padding = '0';
      removeBtn.style.zIndex = '10';

      removeBtn.addEventListener('click', () => {
        selectedWishFile = null;
        wishInput.value = '';
        previewImg.src = '';
        previewContainer.style.display = 'none';
        toggleWishBtn();
      });

      previewContainer.style.position = 'relative';
      previewContainer.appendChild(removeBtn);
    } else {
      previewImg.src = '';
      previewContainer.style.display = 'none';
    }
  }

  function toggleWishBtn() {
    const hasPhoto = selectedWishFile !== null;
    const hasText = wishMessage.value.trim().length > 0;
    const isValid = hasPhoto && hasText;

    wishBtn.disabled = !isValid;
    wishBtn.style.opacity = isValid ? '1' : '0.5';
    wishBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  // ŻYCZENIA – upload
  wishForm.onsubmit = async (e) => {
    e.preventDefault();

    if (!selectedWishFile) {
      statusEl.textContent = 'Wybierz zdjęcie!';
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedWishFile);
    formData.append('message', wishMessage.value.trim());

    statusEl.textContent = 'Przesyłanie życzeń...';

    const res = await fetch('/upload', { method: 'POST', body: formData });
    if (res.ok) {
      selectedWishFile = null;
      wishInput.value = '';
      wishMessage.value = '';
      document.getElementById('charCount').textContent = '0';
      previewImg.src = '';
      previewContainer.style.display = 'none';
      statusEl.innerHTML = '💝 Zdjęcie z życzeniami przesłane pomyślnie!';
      toggleWishBtn();
    } else {
      statusEl.textContent = 'Błąd!';
    }
  };
});
