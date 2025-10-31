// routes/upload.js
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
router.post("/single", (req, res) => {
  upload.single("file")(req, res, (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // 🚨 KIỂM TRA ĐỂ TRẢ VỀ PATH: null AN TOÀN
      if (!req.file) {
        return res.json({ success: true, path: null, filename: null });
      }

      // ✅ FILE ĐÃ ĐƯỢC LƯU VÀO uploadPath
      const filePath = `/uploads/${req.file.filename}`;
      res.json({ success: true, path: filePath, filename: req.file.filename });
    } catch (tryErr) {
      console.error("Upload handler error:", tryErr);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server nội bộ khi xử lý file." });
    }
  });
});

// Upload multiple -> trả về mảng paths
router.post("/multiple", (req, res) => {
  upload.array("files", 10)(req, res, (err) => {
    try {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const paths = (req.files || []).map((f) => `/uploads/${f.filename}`);
      res.json({ success: true, paths });
    } catch (tryErr) {
      console.error("Upload handler error:", tryErr);
      res.status(500).json({ success: false, message: "Lỗi server nội bộ." });
    }
  });
});

module.exports = router;
