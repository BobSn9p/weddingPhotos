document.addEventListener('DOMContentLoaded', () => {
  // Pobierz elementy
  const bulkForm = document.getElementById('bulkUploadForm');
  const wishForm = document.getElementById('wishUploadForm');
  const bulkBtn = bulkForm.querySelector('button[type="submit"]');
  const wishBtn = wishForm.querySelector('button[type="submit"]');
  const photoInput = document.getElementById('photoInput');
  const wishInput = document.getElementById('wishInput');
  const wishMessage = document.getElementById('wishMessage');

  // INICJALIZUJ PRZYCISKI
  bulkBtn.disabled = true;
  wishBtn.disabled = true;

  // WALIDACJA BULK UPLOAD
  photoInput.addEventListener('change', toggleBulkBtn);
  function toggleBulkBtn() {
    const fileCount = photoInput.files.length;
    const hasFiles = fileCount > 0;
    const tooManyFiles = fileCount > 10;
    
    const statusEl = document.getElementById('status');
    
    if (tooManyFiles) {
      alert(`⚠️ Maksymalnie 10 zdjęć!\nWybrano: ${fileCount}\nPonownie wybierz zdjęcia`);
      photoInput.value = '';
      statusEl.textContent = '⚠️ Wybierz maksymalnie 10 zdjęć';
      bulkBtn.disabled = true;
      bulkBtn.style.opacity = '0.5';
    } else if (hasFiles) {
    // ✅ POLSKA DEKLINACJA
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
    }
  }

  // WALIDACJA ŻYCZEŃ
  wishInput.addEventListener('change', toggleWishBtn);
  wishMessage.addEventListener('input', toggleWishBtn);
  function toggleWishBtn() {
    const hasPhoto = wishInput.files.length > 0;
    const hasText = wishMessage.value.trim().length > 0;
    const isValid = hasPhoto && hasText;
    
    wishBtn.disabled = !isValid;
    wishBtn.style.opacity = isValid ? '1' : '0.5';
    wishBtn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  }

  // ✅ BULK UPLOAD - ANALOGICZNIE DO ŻYCZEŃ
  bulkForm.onsubmit = async (e) => {
    e.preventDefault();
    const input = document.getElementById('photoInput');
    const statusEl = document.getElementById('status');

    statusEl.textContent = 'Przesyłanie...';

    for (let file of input.files) {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        statusEl.textContent = 'Błąd: ' + (await res.text());
        return;
      }
    }

    // ✅ ANALOGICZNIE DO ŻYCZEŃ: wyczyszczenie + komunikat + przycisk nieaktywny
    input.value = '';
    statusEl.innerHTML = '✅ Zdjęcia przesłane pomyślnie!';
    bulkBtn.disabled = true;  // ✅ PRZYCISK NIEAKTYWNY
    bulkBtn.style.opacity = '0.5';
  };

  // Życzenia (bez zmian)
  wishForm.onsubmit = async (e) => {
    e.preventDefault();
    const wishInputEl = document.getElementById('wishInput');
    const wishMessageEl = document.getElementById('wishMessage');
    const statusEl = document.getElementById('status');

    if (!wishInputEl.files[0]) {
      statusEl.textContent = 'Wybierz zdjęcie!';
      return;
    }

    const formData = new FormData();
    formData.append('photo', wishInputEl.files[0]);
    formData.append('message', wishMessageEl.value.trim());

    statusEl.textContent = 'Przesyłanie życzeń...';

    const res = await fetch('/upload', { method: 'POST', body: formData });
    if (res.ok) {
      wishInputEl.value = '';
      wishMessageEl.value = '';
      document.getElementById('previewContainer').style.display = 'none';
      statusEl.innerHTML = '💝 Zdjęcie z życzeniami przesłane pomyślnie!';
      toggleWishBtn(); // ✅ PRZYCISK NIEAKTYWNY (automatycznie)
    } else {
      statusEl.textContent = 'Błąd!';
    }
  };

  // Preview
  document.getElementById('wishInput').onchange = (e) => {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('previewContainer');
    const previewImg = document.getElementById('previewImg');
    if (file) {
      previewImg.src = URL.createObjectURL(file);
      previewContainer.style.display = 'block';
    } else {
      previewContainer.style.display = 'none';
    }
  };

  // Licznik
  document.getElementById('wishMessage').oninput = (e) => {
    document.getElementById('charCount').textContent = e.target.value.length;
  };
});
