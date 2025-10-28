const express = require("express");
const router = express.Router();
const Coupon = require("../schemas/coupon");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy danh sách coupon
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const coupons = await Coupon.find();
    Response(res, 200, true, coupons);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Tạo coupon mới
router.post("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    Response(res, 201, true, "Tạo mã giảm giá thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Xóa mềm coupon
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) return Response(res, 404, false, "Không tìm thấy coupon");
      await coupon.softDelete();
      Response(res, 200, true, "Xóa coupon thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);
module.exports = router;
