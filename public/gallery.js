let allPhotos = [];
let currentPhotoIndex = 0;
let isAnimating = false;
let startX = 0, startY = 0, isSwiping = false;
const SWIPE_THRESHOLD = 50;

async function loadPhotos() {
  const res = await fetch('/photos');
  allPhotos = await res.json();
  const gallery = document.getElementById('gallery');
  const noPhotos = document.getElementById('noPhotos');
  
  gallery.innerHTML = '';
  
  if (allPhotos.length === 0) {
    noPhotos.style.display = 'block';
    return;
  }
  
  noPhotos.style.display = 'none';
  
  allPhotos.forEach((photo, index) => {
    const img = document.createElement('img');
    img.src = '/photos/' + photo;
    img.alt = photo;
    img.style.cursor = 'pointer';
    img.dataset.index = index;
    img.addEventListener('click', () => openModal(index));
    gallery.appendChild(img);
  });
}

function openModal(index) {
  currentPhotoIndex = index;
  const modalImg = document.getElementById('modalImg');
  const modal = document.getElementById('modal');
  
  // Reset - jedno zdjęcie
  modalImg.style.transition = 'none';
  modalImg.style.transform = 'translateX(0) scale(1)';
  modalImg.src = `/photos/${allPhotos[currentPhotoIndex]}`;
  
  updateCounter();
  showNavArrows();
  modal.style.display = 'flex';
  
  // Włącz animację
  setTimeout(() => {
    modalImg.style.transition = 'all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)';
  }, 50);
}

function updateCounter() {
  document.getElementById('photoCounter').textContent = `${currentPhotoIndex + 1} / ${allPhotos.length}`;
}

function showNavArrows() {
  const hasPrev = currentPhotoIndex > 0;
  const hasNext = currentPhotoIndex < allPhotos.length - 1;
  document.getElementById('navLeft').classList.toggle('hidden', !hasPrev);
  document.getElementById('navRight').classList.toggle('hidden', !hasNext);
}

// ✅ PERFEKCYJNA ANIMACJA - JEDNO ZDJĘCIE
function slidePhoto(direction) {
  if (isAnimating) return;
  
  const nextIndex = currentPhotoIndex + direction;
  if (nextIndex < 0 || nextIndex >= allPhotos.length) return;
  
  isAnimating = true;
  const modalImg = document.getElementById('modalImg');
  
  // 1. KROK: Stare zdjęcie UCIEKA (szybko)
  const exitDirection = direction > 0 ? '-130%' : '130%';
  modalImg.style.transition = 'transform 0.25s ease-out';
  modalImg.style.transform = `translateX(${exitDirection})`;
  
  // 2. KROK: NOWE zdjęcie (poza ekranem, bez animacji)
  setTimeout(() => {
    modalImg.src = `/photos/${allPhotos[nextIndex]}`;
    modalImg.style.transition = 'none';
    
    // Pozycja START dla nowego zdjęcia (odwrotna strona)
    const entryDirection = direction > 0 ? '130%' : '-130%';
    modalImg.style.transform = `translateX(${entryDirection})`;
    
    // 3. KROK: Płynne WEJŚCIE
    setTimeout(() => {
      modalImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      modalImg.style.transform = 'translateX(0)';
      
      currentPhotoIndex = nextIndex;
      updateCounter();
      showNavArrows();
    }, 20);
    
  }, 250);
  
  // Gotowe na następny swipe
  setTimeout(() => {
    isAnimating = false;
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('navLeft').onclick = () => slidePhoto(-1);
  document.getElementById('navRight').onclick = () => slidePhoto(1);
  
  document.getElementById('modalClose').onclick = () => {
    document.getElementById('modal').style.display = 'none';
  };
  
  document.getElementById('modal').onclick = (e) => {
    if (e.target.id === 'modal') {
      document.getElementById('modal').style.display = 'none';
    }
  };
  
  // SWIPE
  const modal = document.getElementById('modal');
  modal.addEventListener('touchstart', (e) => {
    if (isAnimating) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isSwiping = true;
  }, { passive: true });
  
  modal.addEventListener('touchmove', (e) => {
    if (!isSwiping || isAnimating) return;
    e.preventDefault();
  }, { passive: false });
  
  modal.addEventListener('touchend', (e) => {
    if (!isSwiping || isAnimating) return;
    
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = startX - endX;
    const deltaY = Math.abs(startY - endY);
    
    if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > deltaY) {
      slidePhoto(deltaX > 0 ? 1 : -1); // Lewo=następne, Prawo=poprzednie
    }
    isSwiping = false;
  }, { passive: true });
  
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('modal').style.display === 'flex' && !isAnimating) {
      switch(e.key) {
        case 'ArrowLeft':  e.preventDefault(); slidePhoto(-1); break;
        case 'ArrowRight': e.preventDefault(); slidePhoto(1);  break;
        case 'Escape':     document.getElementById('modal').style.display = 'none'; break;
      }
    }
  });
  
  loadPhotos();
});
