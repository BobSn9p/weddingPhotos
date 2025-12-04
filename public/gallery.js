const SWIPE_THRESHOLD = 50;
const BATCH_SIZE = 20;
let allPhotos = [];
let currentPhotoIndex = 0;
let isAnimating = false;
let startX = 0, startY = 0, isSwiping = false;
let renderedCount = 0;
let scrollObserver = null;
let imageObserver = null;

async function loadPhotos() {
  const res = await fetch('/photos');
  allPhotos = await res.json();
  console.log('API zwraca:', allPhotos);
  const gallery = document.getElementById('gallery');
  const noPhotos = document.getElementById('noPhotos');
  
  gallery.innerHTML = '';
  renderedCount = 0;
  
  if (allPhotos.length === 0) {
    noPhotos.style.display = 'block';
    return;
  }
  
  noPhotos.style.display = 'none';
  console.log('Załadowano zdjęć:', allPhotos.length);
  
  initObservers(gallery);
  renderNextBatch(gallery);
}

function initObservers(gallery) {
  imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const index = parseInt(img.dataset.index);
        img.src = `/photos/${allPhotos[index].filename}`;
        img.loading = 'lazy';
      }
    });
  }, { rootMargin: '100px', threshold: 0.1 });
  
  scrollObserver = new IntersectionObserver((entries) => {
    const sentinel = entries[0];
    if (sentinel.isIntersecting && renderedCount < allPhotos.length) {
      renderNextBatch(sentinel.target.parentNode);
    }
  }, { threshold: 0 });
  
  let sentinel = gallery.querySelector('.sentinel');
  if (!sentinel) {
    sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    sentinel.style.height = '1px';
    gallery.appendChild(sentinel);
  }
}

function renderNextBatch(gallery) {
  const startIndex = renderedCount;
  const endIndex = Math.min(startIndex + BATCH_SIZE, allPhotos.length);
  
  for (let i = startIndex; i < endIndex; i++) {
    createImageElement(gallery, i);
  }
  
  renderedCount = endIndex;
  scrollObserver.observe(gallery.querySelector('.sentinel'));
}

function createImageElement(container, index) {
  const photo = allPhotos[index];
  
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex; flex-direction: column; align-items: center; margin-bottom: 20px;
  `;

  const img = document.createElement('img');
  img.dataset.index = index;
  img.alt = `Zdjęcie ${index + 1}`;
  img.style.cssText = `
    cursor: pointer; background: #f0f0f0; min-height: 200px;
  `;
  img.className = 'gallery-image';
  img.addEventListener('click', () => openModal(index));
  wrapper.appendChild(img);
  imageObserver.observe(img);

  // ✅ KLIKALNY BADGE "Z życzeniami"
  if (photo.message && photo.message.trim() !== '') {
    const badge = document.createElement('div');
    badge.textContent = 'Z życzeniami';
    badge.style.cssText = `
      margin-top: 10px; padding: 8px 16px; 
      background: linear-gradient(135deg, #007bff, #0056b3); 
      color: white; border-radius: 25px; font-size: 14px; 
      font-weight: 600; box-shadow: 0 3px 12px rgba(0,123,255,0.4);
      cursor: pointer; transition: all 0.2s ease; user-select: none;
    `;
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = 'scale(1.05)';
      badge.style.background = 'linear-gradient(135deg, #0056b3, #004494)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = 'scale(1)';
      badge.style.background = 'linear-gradient(135deg, #007bff, #0056b3)';
    });
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      showWishesOverlay(index);
    });
    wrapper.appendChild(badge);
  }
  
  container.insertBefore(wrapper, container.querySelector('.sentinel'));
}

function showWishesOverlay(index) {
  const photo = allPhotos[index];
  
  // Usuń poprzedni overlay
  const existingOverlay = document.getElementById('wishesOverlay');
  if (existingOverlay) existingOverlay.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'wishesOverlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.9); z-index: 2000;
    display: flex; justify-content: center; align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  `;
  
  const wishesBox = document.createElement('div');
  wishesBox.style.cssText = `
    background: white; padding: 40px; border-radius: 20px;
    max-width: 90vw; max-height: 85vh; overflow-y: auto;
    text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    animation: slideIn 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  `;
  
  wishesBox.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 20px; color: #333;">
      💝 Życzenia
    </div>
    <div id="wishesText" style="
      font-size: 20px; line-height: 1.6; color: #444; 
      padding: 25px; background: #f8f9fa; border-radius: 12px;
      border-left: 5px solid #007bff;
      ${/* ✅ ZAWIJANIE TEXTU */ `
        word-wrap: break-word; 
        overflow-wrap: break-word; 
        white-space: pre-wrap; 
        text-align: left; 
        max-height: 60vh; 
        overflow-y: auto;
      `}
    ">
      ${photo.message}
    </div>
    <button onclick="document.getElementById('wishesOverlay').remove()" 
      style="
        margin-top: 25px; padding: 12px 30px; background: #007bff;
        color: white; border: none; border-radius: 25px; font-size: 16px;
        cursor: pointer; transition: background 0.2s;
      "
      onmouseover="this.style.background='#0056b3'"
      onmouseout="this.style.background='#007bff'">
      Zamknij
    </button>
  `;
  
  overlay.appendChild(wishesBox);
  document.body.appendChild(overlay);
}


function openModal(index) {
  currentPhotoIndex = index;
  const modalImg = document.getElementById('modalImg');
  const modal = document.getElementById('modal');
  
  const photo = allPhotos[currentPhotoIndex];
  console.log('Otwieram modal:', photo.filename);
  
  modalImg.style.transition = 'none';
  modalImg.style.transform = 'translateX(0) scale(1)';
  modalImg.src = `/photos/${photo.filename}`;
  
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
    modalImg.src = `/photos/${allPhotos[nextIndex].filename}`;
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
