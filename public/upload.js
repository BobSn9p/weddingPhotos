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
  const charCount = document.getElementById('charCount');
  const selectPhotosBtn = document.getElementById('selectPhotosBtn');
  const selectWishPhotoBtn = document.getElementById('selectWishPhotoBtn');

  selectPhotosBtn.addEventListener('click', () => {
    photoInput.click();
  });

  selectWishPhotoBtn.addEventListener('click', () => {
  wishInput.click();
});
  
  // Reset stanu na starcie
  photoInput.value = '';
  wishInput.value = '';
  wishMessage.value = '';
  charCount.textContent = '0';
  bulkPreviewContainer.innerHTML = '';
  bulkPreviewContainer.style.display = 'none';
  previewContainer.style.display = 'none';
  previewImg.src = '';

  bulkBtn.disabled = true;
  wishBtn.disabled = true;

  // Tablica wybranych plików dla bulk upload
  let selectedFiles = [];
  // Pojedynczy plik dla życzeń
  let selectedWishFile = null;

  // Obsługa zmiany inputa dla wielu zdjęć
photoInput.addEventListener('change', (e) => {
  const newFiles = Array.from(e.target.files || []);
  
  if (newFiles.length > 10) {
    // ✅ BLOKUJ >10 PLIKÓW - ALERT + NIE DODAJAJ
    alert(`⚠️ Maksymalnie 10 zdjęć!\nWybrano: ${newFiles.length}\nWybierz maksymalnie 10.`);
    photoInput.value = ''; // Reset input
    return;
  }
  
  // ✅ DODAJ TYLKO jeśli <=10
  selectedFiles = newFiles;
  renderBulkPreview();
  validateBulkButton();
});

  // Renderowanie miniatur z krzyżykami dla wielu zdjęć
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
      wrapper.style.margin = '5px';

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
      removeBtn.className = 'wish-remove-btn';  // ✅ CSS robi resztę!
      removeBtn.textContent = '✕';
      removeBtn.title = 'Usuń zdjęcie';   

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

  // Walidacja przycisku wysyłki dla wielu zdjęć
  function validateBulkButton() {
    const fileCount = selectedFiles.length;
    const hasFiles = fileCount > 0;
    const tooManyFiles = fileCount > 10;

    if (tooManyFiles) {
      alert(`⚠️ Maksymalnie 10 zdjęć!\nWybrano: ${fileCount}\nUsuń kilka zdjęć.`);
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

  // Obsługa wysyłki wielu zdjęć
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

  // Obsługa życzeń - zmiana pliku z podglądem i krzyżykiem
  wishInput.addEventListener('change', () => {
    selectedWishFile = wishInput.files[0] || null;
    renderWishPreview();
    toggleWishBtn();
  });

  wishMessage.addEventListener('input', toggleWishBtn);

// ⭐️ TWÓJ ORYGINAŁ + TYLKO JEDNA LINIJKA (oznaczona ⭐️)
function renderWishPreview() {
  // CZYSZCZENIE
  const oldRemoveBtn = previewContainer.querySelector('.wish-remove-btn');
  if (oldRemoveBtn) oldRemoveBtn.remove();
  
  previewImg.src = '';
  
  if (selectedWishFile) {
    // ⭐️ TYLKO src + dodaj przycisk - CSS zrobi resztę!
    previewImg.src = URL.createObjectURL(selectedWishFile);
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.title = 'Usuń zdjęcie';
    removeBtn.addEventListener('click', () => {
      selectedWishFile = null;
      wishInput.value = '';
      previewImg.src = '';
      previewContainer.classList.add('hidden'); // ⭐️ CSS class zamiast inline style
      toggleWishBtn();
      removeBtn.remove();
    });

    previewContainer.style.position = 'relative';
    previewContainer.appendChild(removeBtn);
  } else {
    previewImg.src = '';
    previewContainer.classList.add('hidden'); // ⭐️ CSS class zamiast inline style
  }
}


  // Walidacja przycisku życzeń
  function toggleWishBtn() {
    const hasPhoto = selectedWishFile !== null;
    const hasText = wishMessage.value.trim().length > 0;
    const isValid = hasPhoto && hasText;

    wishBtn.disabled = !isValid;
    wishBtn.style.opacity = isValid ? '1' : '0.5';
    wishBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  // Obsługa wysyłki życzeń
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
    charCount.textContent = '0';
    previewImg.src = '';
    // USUŃ TYLKO PRZYCISK USUWANIA zamiast czyszczenia całego kontenera
    const removeBtn = previewContainer.querySelector('.remove-btn');
    if (removeBtn) removeBtn.remove();
    previewContainer.style.display = 'none';

    statusEl.innerHTML = '💝 Zdjęcie z życzeniami przesłane pomyślnie!';
    toggleWishBtn();
  } else {
    statusEl.textContent = 'Błąd!';
  }
};


  // Licznik znaków dla pola z życzeniami
  wishMessage.addEventListener('input', (e) => {
    charCount.textContent = e.target.value.length;
  });
});
