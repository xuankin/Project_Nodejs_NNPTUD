const express = require("express");
const router = express.Router();
const Review = require("../schemas/review");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Người dùng thêm đánh giá
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const { product, rating, comment } = req.body;
    const review = new Review({ user: req.userId, product, rating, comment });
    await review.save();
    Response(res, 201, true, "Đánh giá thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Lấy đánh giá theo sản phẩm
router.get("/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    }).populate("user", "fullName");
    Response(res, 200, true, reviews);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
module.exports = router;
