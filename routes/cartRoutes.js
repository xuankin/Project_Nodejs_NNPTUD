// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const Cart = require("../schemas/cart");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// LẤY GIỎ HÀNG
router.get("/me", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate(
      "items.product"
    );
    Response(res, 200, true, cart || { items: [], totalAmount: 0 });
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// THÊM VÀO GIỎ – TĂNG SỐ LƯỢNG NẾU ĐÃ CÓ
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const { product, quantity = 1 } = req.body;
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = new Cart({ user: req.userId, items: [] });

    // 🎯 CHỈNH SỬA: Thêm kiểm tra i.product trước khi gọi .toString()
    // Giúp tránh lỗi 500 nếu có sản phẩm bị xóa mà vẫn còn trong giỏ
    const existing = cart.items.find(
      (i) => i.product && i.product.toString() === product
    );

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product, quantity });
    }

    await cart.save();
    Response(res, 200, true, "Thêm vào giỏ thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// XÓA KHỎI GIỎ
router.delete(
  "/:productId",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.userId });
      if (!cart) return Response(res, 404, false, "Chưa có giỏ");

      cart.items = cart.items.filter(
        // 🎯 CHỈNH SỬA: Thêm kiểm tra i.product trước khi gọi .toString()
        (i) => i.product && i.product.toString() !== req.params.productId
      );
      await cart.save();
      Response(res, 200, true, "Xóa khỏi giỏ thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

module.exports = router;
