const express = require("express");
const router = express.Router();
const Payment = require("../schemas/payment");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Tạo thanh toán
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const pay = new Payment(req.body);
    await pay.save();
    Response(res, 201, true, "Tạo giao dịch thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
router.put("/:id", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const pay = await Payment.findById(req.params.id);
    if (!pay) return Response(res, 404, false, "Không tìm thấy giao dịch");

    // Chỉ cho phép cập nhật nếu trạng thái là Pending
    if (pay.status !== "Pending") {
      return Response(res, 400, false, "Không thể thay đổi giao dịch đã xử lý");
    }

    // Cập nhật method và amount (nếu có)
    Object.assign(pay, req.body);
    await pay.save();

    Response(res, 200, true, "Cập nhật phương thức thanh toán thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
// 📍 Lấy danh sách thanh toán (ADMIN)
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const payments = await Payment.find();
    Response(res, 200, true, payments);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
module.exports = router;
