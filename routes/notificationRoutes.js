// routes/notificationRoutes.js

const express = require("express");
const router = express.Router();
const Notification = require("../schemas/notification");
const User = require("../schemas/user");
const Role = require("../schemas/role"); // 🎯 THÊM: Import Role Schema
const { Authentication, Authorization } = require("../utils/authMiddleware");

// 🎯 KHẮC PHỤC TRIỆT ĐỂ: Import tất cả các hàm phản hồi cần thiết
const {
  Response,
  BadRequestResponse,
  ServerErrorResponse,
} = require("../utils/responseHandler");

// 📍 Lấy thông báo người dùng
router.get("/me", Authentication, async (req, res) => {
  try {
    const list = await Notification.find({ user: req.userId }).sort({
      createdAt: -1,
    });
    Response(res, 200, true, list);
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// 📍 ADMIN: Tạo thông báo mới (Gửi đến 1 user hoặc tất cả)
router.post("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const { message, type, recipientId } = req.body;

    if (!message) return BadRequestResponse(res, "Thông báo không được trống");

    if (recipientId === "ALL") {
      // 1. TÌM ROLE ID CỦA "USER" (Để tránh lỗi Cast to ObjectId)
      const userRole = await Role.findOne({ name: "USER" }, "_id");
      if (!userRole) {
        // Đây là lỗi cấu hình cơ sở dữ liệu nếu Role "USER" không tồn tại
        return ServerErrorResponse(res, {
          message: "Lỗi cấu hình: Không tìm thấy Role 'USER' (ObjectId)",
        });
      }

      // 2. TRUY VẤN USER BẰNG ROLE ID (ObjectId hợp lệ)
      const users = await User.find({ role: userRole._id }, "_id");

      const notifications = users.map((user) => ({
        user: user._id,
        message,
        type: type || "SYSTEM",
      }));
      await Notification.insertMany(notifications);
      Response(res, 201, true, "Đã gửi thông báo đến tất cả người dùng");
    } else if (recipientId) {
      // Gửi đến một người dùng cụ thể
      const user = await User.findById(recipientId);
      if (!user) return BadRequestResponse(res, "Không tìm thấy người nhận");

      const noti = new Notification({
        user: recipientId,
        message,
        type: type || "SYSTEM",
      });
      await noti.save();
      Response(res, 201, true, "Đã gửi thông báo đến người dùng cụ thể");
    } else {
      return BadRequestResponse(
        res,
        "Thiếu recipientId (ID người dùng hoặc 'ALL')"
      );
    }
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// 📍 Đánh dấu đã đọc
router.put("/:id/read", Authentication, async (req, res) => {
  try {
    const noti = await Notification.findById(req.params.id);
    if (!noti) return Response(res, 404, false, "Không tìm thấy thông báo");

    // Kiểm tra quyền (chỉ chủ sở hữu mới được đánh dấu đã đọc)
    if (noti.user.toString() !== req.userId)
      return Response(res, 403, false, "Không có quyền");

    noti.isRead = true;
    await noti.save();
    Response(res, 200, true, "Đã đánh dấu đã đọc");
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});
module.exports = router;
