const express = require("express");
const router = express.Router();
const Notification = require("../schemas/notification");
const { Authentication } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy thông báo người dùng
router.get("/me", Authentication, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.userId });
    Response(res, 200, true, list);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Đánh dấu đã đọc
router.put("/:id/read", Authentication, async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);
    if (!noti) return Response(res, 404, false, "Không tìm thấy thông báo");
    noti.isRead = true;
    await noti.save();
    Response(res, 200, true, "Đã đánh dấu đã đọc");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
module.exports = router;
