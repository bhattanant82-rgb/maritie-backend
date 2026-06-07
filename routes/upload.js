// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use diskStorage instead of memoryStorage to prevent buffer issues with videos
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

router.post('/image', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
  try {
    let result;
    if (req.file.mimetype.startsWith('video/')) {
      result = await cloudinary.uploader.upload_large(req.file.path, {
        resource_type: 'video',
        folder: 'marutie',
        chunk_size: 6000000 // 6MB chunks
      });
    } else {
      result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'image',
        folder: 'marutie'
      });
    }
    
    // Clean up local file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary Upload Error:", err);
    res.status(500).json({ msg: 'Server error during upload' });
  }
});

module.exports = router;
