const express = require("express");
const router = express.Router();
const Wishlist = require("../schemas/wishlist");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy danh sách yêu thích
router.get("/me", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const list = await Wishlist.findOne({ user: req.userId }).populate(
      "products"
    );
    Response(res, 200, true, list || { products: [] });
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Thêm sản phẩm vào danh sách yêu thích
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const { product } = req.body;
    let list = await Wishlist.findOne({ user: req.userId });
    if (!list) list = new Wishlist({ user: req.userId, products: [] });

    if (!list.products.includes(product)) list.products.push(product);
    await list.save();
    Response(res, 200, true, "Đã thêm vào danh sách yêu thích");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Xóa sản phẩm khỏi danh sách yêu thích
router.delete(
  "/:productId",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    try {
      const list = await Wishlist.findOne({ user: req.userId });
      if (!list)
        return Response(res, 404, false, "Không có danh sách yêu thích");

      // 🎯 CHỈNH SỬA: Thêm kiểm tra an toàn (p)
      // 1. Kiểm tra p có tồn tại không (loại bỏ null/undefined references)
      // 2. Sau đó mới so sánh giá trị
      list.products = list.products.filter(
        (p) => p && p.toString() !== req.params.productId
      );

      await list.save();
      Response(res, 200, true, "Đã xóa khỏi danh sách yêu thích");
    } catch (err) {
      // 🎯 Tăng tính minh bạch trong Log
      console.error("Lỗi xóa Wishlist:", err);
      Response(res, 500, false, err.message);
    }
  }
);
// module.exports = router;
module.exports = router;
