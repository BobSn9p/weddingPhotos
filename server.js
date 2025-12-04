const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/photos/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());

// ✅ ODCZYT Z FOLDERU + ŻYCZENIA Z photos.json (NAJNOWSZE NA GÓRZE)
app.get('/photos', (req, res) => {
  try {
    const files = fs.readdirSync('public/photos');
    const images = files.filter(name => /\.(jpg|jpeg|png|gif|webp)$/i.test(name));
    
    // Sortuj według daty (najnowsze na górze)
    images.sort((a, b) => {
      return fs.statSync(path.join('public/photos', b)).mtime.getTime() - 
             fs.statSync(path.join('public/photos', a)).mtime.getTime();
    });
    
    // Wczytaj życzenia
    let photoMessages = {};
    try {
      const data = fs.readFileSync('photos.json', 'utf8');
      photoMessages = JSON.parse(data);
    } catch {
      photoMessages = {};
    }
    
    // Połącz zdjęcia z życzeniami
    const photosWithMessages = images.map(filename => ({
      filename,
      message: photoMessages[filename] || ''
    }));
    
    console.log(`Załadowano ${photosWithMessages.length} zdjęć z życzeniami`);
    res.json(photosWithMessages);
  } catch (err) {
    console.error('Błąd odczytu folderu:', err);
    res.json([]);
  }
});

// ✅ UPLOAD + ŻYCZENIA
app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku' });
    }
    
    const message = req.body.message || '';
    
    // Zapisz życzenia do photos.json
    let photoMessages = {};
    try {
      const data = fs.readFileSync('photos.json', 'utf8');
      photoMessages = JSON.parse(data);
    } catch {
      photoMessages = {};
    }
    
    photoMessages[req.file.filename] = message;
    fs.writeFileSync('photos.json', JSON.stringify(photoMessages, null, 2));
    
    console.log(`Nowe zdjęcie + życzenia: ${req.file.filename} "${message}"`);
    res.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Błąd uploadu' });
  }
});

app.listen(PORT, () => {
  console.log(`Server działa na http://localhost:${PORT}`);
});
