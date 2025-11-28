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

// ✅ ODCZYT Z FOLDERU - ZAWSZE AKUALNE!
app.get('/photos', (req, res) => {
  try {
    const files = fs.readdirSync('public/photos');
    const images = files.filter(name => /\.(jpg|jpeg|png|gif|webp)$/i.test(name));
    
    // ✅ ODWÓTNIEJ KOLEJNOŚĆ - NAJNOWSZE NA GÓRZE!
    images.sort((a, b) => {
      return fs.statSync(path.join('public/photos', b)).mtime.getTime() - 
             fs.statSync(path.join('public/photos', a)).mtime.getTime();
    });
    
    console.log(`Załadowano ${images.length} zdjęć (najnowsze na górze)`);
    res.json(images);
  } catch (err) {
    console.error('Błąd odczytu folderu:', err);
    res.json([]);
  }
});


app.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku' });
    }
    
    console.log(`Nowe zdjęcie: ${req.file.filename}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Błąd uploadu' });
  }
});

app.listen(PORT, () => {
  console.log(`Server działa na http://localhost:${PORT}`);
});
