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
