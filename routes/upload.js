const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đường dẫn lưu file
const uploadPath = path.join(__dirname, "../public/uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, file.fieldname + "-" + unique + ext);
  },
});

// File filter & limits
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only images are allowed (jpg, jpeg, png, gif)"));
  },
});

// Upload single -> trả về path public
router.post("/single", upload.single("file"), (req, res) => {
  try {
    const filePath = `/uploads/${req.file.filename}`;
    res.json({ success: true, path: filePath, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Upload multiple -> trả về mảng paths
router.post("/multiple", upload.array("files", 10), (req, res) => {
  try {
    const paths = req.files.map((f) => `/uploads/${f.filename}`);
    res.json({ success: true, paths });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
