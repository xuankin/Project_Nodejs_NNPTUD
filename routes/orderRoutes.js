const express = require("express");
const router = express.Router();
const Order = require("../schemas/order");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Tạo đơn hàng (USER)
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const order = new Order({ ...req.body, user: req.userId });
    await order.save();
    Response(res, 201, true, "Tạo đơn hàng thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Lấy đơn hàng của chính người dùng
router.get("/me", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate(
      "items.product"
    );
    Response(res, 200, true, orders);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 ADMIN xem tất cả đơn hàng
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const orders = await Order.find().populate("user items.product");
    Response(res, 200, true, orders);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Cập nhật trạng thái đơn hàng (ADMIN)
router.put("/:id", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return Response(res, 404, false, "Không tìm thấy đơn hàng");

    order.status = req.body.status || order.status;
    await order.save();
    Response(res, 200, true, "Cập nhật đơn hàng thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
module.exports = router;
