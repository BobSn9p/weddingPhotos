async function loadPhotos() {
  const res = await fetch('/photos');
  const photos = await res.json();
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';
  photos.forEach(photo => {
    const img = document.createElement('img');
    img.src = '/photos/' + photo;
    img.alt = photo;
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      openModal(img.src);
    });
    gallery.appendChild(img);
  });
}

function openModal(src) {
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  modal.style.display = 'flex';
  modalImg.src = src;
}

document.getElementById('modalClose').onclick = () => {
  document.getElementById('modal').style.display = 'none';
};

document.getElementById('modal').onclick = (e) => {
  if (e.target.id === 'modal') {
    document.getElementById('modal').style.display = 'none';
  }
};

document.getElementById('uploadForm').onsubmit = async (e) => {
  e.preventDefault();
  const input = document.getElementById('photoInput');
  const formData = new FormData();
  formData.append('photo', input.files[0]);

  const res = await fetch('/upload', { method: 'POST', body: formData });
  if (res.ok) {
    input.value = '';
    loadPhotos();
  } else {
    alert('Błąd przy dodawaniu zdjęcia');
  }
};

loadPhotos();
