const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Multer - zapis plików od razu w folderze public/photos z oryginalnym rozszerzeniem
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/photos');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

app.use(express.static('public'));

// Endpoint do uploadu pliku
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Brak przesłanego pliku.');
  }
  res.send({ status: 'success', filename: req.file.filename });
});

// Endpoint do pobierania listy zdjęć
app.get('/photos', (req, res) => {
  try {
    const files = fs.readdirSync('public/photos');
    res.json(files);
  } catch (err) {
    res.status(500).send('Błąd odczytu zdjęć.');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));
