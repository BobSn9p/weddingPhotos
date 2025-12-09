const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // Needed for initial sync checks
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB upload limit
const DIRS = {
  public: 'public',
  photos: 'public/photos',
  thumbnails: 'public/thumbnails',
  originals: 'public/originals'
};

// Ensure directories exist
Object.values(DIRS).forEach(dir => {
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage - save to 'originals' temporarily
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIRS.originals);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, GIF, WebP images are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter
});

app.use(express.static('public'));
app.use(express.json());

// Helper to safely read/write JSON
const JSON_FILE = 'photos.json';
async function updatePhotoMessages(filename, message) {
  try {
    let data = '{}';
    try {
      data = await fs.readFile(JSON_FILE, 'utf8');
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }

    const messages = JSON.parse(data || '{}');
    messages[filename] = message;

    await fs.writeFile(JSON_FILE, JSON.stringify(messages, null, 2));
  } catch (err) {
    console.error('Error updating photos.json:', err);
    throw err;
  }
}

async function getPhotoMessages() {
  try {
    const data = await fs.readFile(JSON_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// GET /photos - optimized listing
app.get('/photos', async (req, res) => {
  try {
    // Read from 'photos' directory (optimized images)
    const files = await fs.readdir(DIRS.photos);
    const images = files.filter(name => /\.(jpg|jpeg|png|gif|webp)$/i.test(name));

    // Sort by modification time
    const stats = await Promise.all(
      images.map(async name => ({
        name,
        mtime: (await fs.stat(path.join(DIRS.photos, name))).mtime.getTime()
      }))
    );

    stats.sort((a, b) => b.mtime - a.mtime);

    const messages = await getPhotoMessages();

    const response = stats.map(file => ({
      filename: file.name,
      message: messages[file.name] || '',
      thumbnail: `/thumbnails/${file.name}`, // Standard path for frontend
      original: `/photos/${file.name}`       // Standard path for frontend
    }));

    res.json(response);
  } catch (err) {
    console.error('Error reading photos:', err);
    res.status(500).json([]);
  }
});

// POST /upload - with Sharp processing
app.post('/upload', (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: '📸 Image too large! Max 50MB' });
        }
        return res.status(400).json({ error: `File error: ${err.message}` });
      }
      return res.status(500).json({ error: 'Server error' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const filename = req.file.filename;
      const originalPath = req.file.path;
      const optimizedPath = path.join(DIRS.photos, filename);
      const thumbnailPath = path.join(DIRS.thumbnails, filename);

      // Process with Sharp
      // 1. Create optimized version (max width 1920px, high quality jpeg/webp)
      //    We preserve the original format for simplicity or convert to friendly format.
      //    Let's keep original format to avoid extension confusion, but re-encode.
      await sharp(originalPath)
        .rotate() // Auto-rotate based on EXIF
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .toFile(optimizedPath);

      // 2. Create thumbnail (fixed 300x300 or similar)
      await sharp(originalPath)
        .rotate()
        .resize(400, 400, { fit: 'cover' })
        .toFile(thumbnailPath);

      // Save message
      const message = req.body.message || '';
      if (message) {
        await updatePhotoMessages(filename, message);
      }

      console.log(`✅ Processed: ${filename}`);
      res.json({ success: true, filename });

    } catch (error) {
      console.error('Processing error:', error);
      // Cleanup on error
      try {
        await fs.unlink(req.file.path);
      } catch { }
      res.status(500).json({ error: 'Error processing image' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📸 Max upload size: 50MB`);
});
