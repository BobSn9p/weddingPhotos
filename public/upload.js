document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. INICJALIZACJA ELEMENTÓW + RESET
  // =========================================================================
  const bulkForm = document.getElementById('bulkUploadForm');
  const wishForm = document.getElementById('wishUploadForm');
  const statusEl = document.getElementById('status');
  
  const bulkBtn = bulkForm.querySelector('button[type="submit"]');
  const wishBtn = wishForm.querySelector('button[type="submit"]');
  const photoInput = document.getElementById('photoInput');
  const wishInput = document.getElementById('wishInput');
  const wishMessage = document.getElementById('wishMessage');
  const charCount = document.getElementById('charCount');
  const bulkPreviewContainer = document.getElementById('bulkPreviewContainer');
  const wishPreviewContainer = document.getElementById('previewContainer');

  // Reset na starcie (po odświeżeniu)
  resetBulkForm();
  resetWishForm();

  // Inicjalizuj przyciski jako nieaktywne
  bulkBtn.disabled = true;
  wishBtn.disabled = true;

  // =========================================================================
  // 2. WALIDACJA + EVENT LISTENERY
  // =========================================================================
  
  // Bulk upload walidacja + podgląd
  photoInput.addEventListener('change', handleBulkInputChange);
  
  // Życzenia walidacja
  wishInput.addEventListener('change', handleWishInputChange);
  wishMessage.addEventListener('input', handleWishInputChange);

  // =========================================================================
  // 3. FUNKCJE WALIDACYJNE
  // =========================================================================
  
  function handleBulkInputChange() {
    const fileCount = photoInput.files.length;
    
    if (fileCount > 10) {
      alert(`⚠️ Maksymalnie 10 zdjęć!\nWybrano: ${fileCount}\nPonownie wybierz zdjęcia`);
      resetBulkForm();
      statusEl.textContent = '⚠️ Wybierz maksymalnie 10 zdjęć';
      return;
    }
    
    if (fileCount > 0) {
      showBulkPreview();
      updateBulkStatus(fileCount);
      bulkBtn.disabled = false;
      bulkBtn.style.opacity = '1';
    } else {
      resetBulkForm();
    }
  }

  function handleWishInputChange() {
    const hasPhoto = wishInput.files.length > 0;
    const hasText = wishMessage.value.trim().length > 0;
    
    wishBtn.disabled = !(hasPhoto && hasText);
    wishBtn.style.opacity = (hasPhoto && hasText) ? '1' : '0.5';
    wishBtn.style.cursor = (hasPhoto && hasText) ? 'pointer' : 'not-allowed';
  }

  function updateBulkStatus(count) {
    let photosText = '';
    if (count === 1) {
      photosText = '1 zdjęcie';
    } else if (count % 10 >= 2 && count % 10 <= 4 && (count < 10 || count > 20)) {
      photosText = `${count} zdjęcia`;
    } else {
      photosText = `${count} zdjęć`;
    }
    statusEl.textContent = `✅ Gotowe: ${photosText}`;
  }

  // =========================================================================
  // 4. FUNKCJE RESET
  // =========================================================================
  
  function resetBulkForm() {
    photoInput.value = '';
    if (bulkPreviewContainer) {
      bulkPreviewContainer.innerHTML = '';
      bulkPreviewContainer.style.display = 'none';
    }
    statusEl.textContent = '';
    bulkBtn.disabled = true;
    bulkBtn.style.opacity = '0.5';
  }

  function resetWishForm() {
    wishInput.value = '';
    wishMessage.value = '';
    charCount.textContent = '0';
    if (wishPreviewContainer) wishPreviewContainer.style.display = 'none';
  }

  function showBulkPreview() {
    const files = photoInput.files;
    if (!bulkPreviewContainer) return;
    
    bulkPreviewContainer.innerHTML = '';
    bulkPreviewContainer.style.display = 'flex';

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) return;

      const img = document.createElement('img');
      Object.assign(img.style, {
        width: '100px',
        height: '100px',
        objectFit: 'cover',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      });
      img.src = URL.createObjectURL(file);
      bulkPreviewContainer.appendChild(img);
    });
  }

  // =========================================================================
  // 5. SUBMIT HANDLERY
  // =========================================================================
  
  bulkForm.onsubmit = async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Przesyłanie...';

    for (let file of photoInput.files) {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        statusEl.textContent = 'Błąd: ' + await res.text();
        return;
      }
    }

    resetBulkForm();
    statusEl.innerHTML = '✅ Zdjęcia przesłane pomyślnie!';
  };

  wishForm.onsubmit = async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('status');

    if (!wishInput.files[0]) {
      statusEl.textContent = 'Wybierz zdjęcie!';
      return;
    }

    const formData = new FormData();
    formData.append('photo', wishInput.files[0]);
    formData.append('message', wishMessage.value.trim());

    statusEl.textContent = 'Przesyłanie życzeń...';

    const res = await fetch('/upload', { method: 'POST', body: formData });
    if (res.ok) {
      resetWishForm();
      statusEl.innerHTML = '💝 Zdjęcie z życzeniami przesłane pomyślnie!';
    } else {
      statusEl.textContent = 'Błąd!';
    }
  };

  // =========================================================================
  // 6. PREVIEW + LICZNIK ŻYCZEŃ
  // =========================================================================
  
  wishInput.onchange = (e) => {
    const file = e.target.files[0];
    if (wishPreviewContainer) {
      const previewImg = document.getElementById('previewImg');
      if (file) {
        previewImg.src = URL.createObjectURL(file);
        wishPreviewContainer.style.display = 'block';
      } else {
        wishPreviewContainer.style.display = 'none';
      }
    }
  };

  wishMessage.oninput = (e) => {
    charCount.textContent = e.target.value.length;
  };
});
