let allPhotos = [];
let currentPhotoIndex = 0;
let isAnimating = false;
let startX = 0, startY = 0, isSwiping = false;
const SWIPE_THRESHOLD = 50;
const VISIBLE_LIMIT = 20; // Pokazuj tylko 20 widocznych
let observer = null;

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
  
  // ✅ DODAJ TYLKO PIERWSZE 20 + OBSERVER
  initVirtualScroll(gallery);
}

function initVirtualScroll(gallery) {
  // Usuń poprzedni observer
  if (observer) observer.disconnect();
  
  // Stwórz placeholder'y dla niewidocznych zdjęć
  for (let i = 0; i < Math.min(VISIBLE_LIMIT, allPhotos.length); i++) {
    createImageElement(gallery, i);
  }
  
  // ✅ INTERSECTION OBSERVER - ładuj tylko widoczne
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const index = parseInt(img.dataset.index);
        
        // Ustaw src tylko gdy widoczne
        if (!img.src || img.src === '') {
          img.src = `/photos/${allPhotos[index]}`;
          img.loading = 'lazy';
        }
      }
    });
  }, {
    rootMargin: '100px', // Ładuj 100px przed widocznością
    threshold: 0.1
  });
  
  // Obserwuj wszystkie obrazki
  const images = gallery.querySelectorAll('img');
  images.forEach(img => observer.observe(img));
}

function createImageElement(container, index) {
  const img = document.createElement('img');
  img.dataset.index = index;
  img.alt = `Zdjęcie ${index + 1}`;
  img.style.cursor = 'pointer';
  img.className = 'gallery-image';
  img.addEventListener('click', () => openModal(index));
  
  // ✅ PLACEHOLDER - szary kwadrat zanim się załaduje
  img.style.background = '#f0f0f0';
  img.style.minHeight = '200px';
  
  container.appendChild(img);
  return img;
}

function openModal(index) {
  currentPhotoIndex = index;
  const modalImg = document.getElementById('modalImg');
  const modal = document.getElementById('modal');
  
  modalImg.style.transition = 'none';
  modalImg.style.transform = 'translateX(0) scale(1)';
  modalImg.src = `/photos/${allPhotos[currentPhotoIndex]}`;
  
  updateCounter();
  showNavArrows();
  modal.style.display = 'flex';
  
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

function slidePhoto(direction) {
  if (isAnimating) return;
  
  const nextIndex = currentPhotoIndex + direction;
  if (nextIndex < 0 || nextIndex >= allPhotos.length) return;
  
  isAnimating = true;
  const modalImg = document.getElementById('modalImg');
  
  const exitDirection = direction > 0 ? '-130%' : '130%';
  modalImg.style.transition = 'transform 0.25s ease-out';
  modalImg.style.transform = `translateX(${exitDirection})`;
  
  setTimeout(() => {
    modalImg.src = `/photos/${allPhotos[nextIndex]}`;
    modalImg.style.transition = 'none';
    const entryDirection = direction > 0 ? '130%' : '-130%';
    modalImg.style.transform = `translateX(${entryDirection})`;
    
    setTimeout(() => {
      modalImg.style.transition = 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
      modalImg.style.transform = 'translateX(0)';
      
      currentPhotoIndex = nextIndex;
      updateCounter();
      showNavArrows();
    }, 20);
  }, 250);
  
  setTimeout(() => {
    isAnimating = false;
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  // Event listeners (bez zmian)
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
      slidePhoto(deltaX > 0 ? 1 : -1);
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
