const express = require("express");
const router = express.Router();
const Cart = require("../schemas/cart");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy giỏ hàng của người dùng
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

// 📍 Thêm sản phẩm vào giỏ
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const { product, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) cart = new Cart({ user: req.userId, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === product);
    if (existing) existing.quantity += quantity || 1;
    else cart.items.push({ product, quantity: quantity || 1 });

    await cart.save();
    Response(res, 200, true, "Thêm vào giỏ hàng thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Xóa sản phẩm khỏi giỏ
router.delete(
  "/:productId",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.userId });
      if (!cart) return Response(res, 404, false, "Chưa có giỏ hàng");

      cart.items = cart.items.filter(
        (i) => i.product.toString() !== req.params.productId
      );
      await cart.save();
      Response(res, 200, true, "Xóa sản phẩm khỏi giỏ hàng thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);
module.exports = router;
