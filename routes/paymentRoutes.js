// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const Payment = require("../schemas/payment");
const Order = require("../schemas/order");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");
const { createPaymentUrl, verifyReturnUrl } = require("../utils/vnpayHelper");

// 📍 Tạo thanh toán (Các method không phải VNPay)
router.post("/", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const pay = new Payment(req.body);
    await pay.save();
    Response(res, 201, true, "Tạo giao dịch thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Khởi tạo VNPay Payment (POST /payments/vnpay/create)
router.post(
  "/vnpay/create",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return Response(res, 400, false, "Thiếu orderId");

      const order = await Order.findById(orderId);
      if (!order) return Response(res, 404, false, "Đơn hàng không tồn tại");
      if (order.status !== "Pending")
        return Response(
          res,
          400,
          false,
          "Đơn hàng đã được xử lý hoặc thanh toán"
        );

      // 1. Tạo bản ghi Payment (Pending)
      let payment = await Payment.create({
        order: orderId,
        method: "VNPAY",
        amount: order.finalAmount,
        status: "Pending",
      });

      // 2. Cập nhật Order với payment ID
      order.payment = payment._id;
      await order.save();

      // 3. Tạo URL VNPay
      const vnpayUrl = createPaymentUrl({
        amount: order.finalAmount,
        txnRef: payment._id.toString(), // Sử dụng Payment ID làm mã giao dịch
        ip: req.socket.remoteAddress,
      });

      Response(res, 201, true, { paymentId: payment._id, vnpayUrl });
    } catch (err) {
      console.error(err);
      Response(res, 500, false, err.message);
    }
  }
);

// 📍 Xử lý kết quả VNPay trả về (GET /payments/vnpay/return)
router.get("/vnpay/return", async (req, res) => {
  try {
    const vnp_Params = req.query;
    const { isVerified } = verifyReturnUrl(vnp_Params);

    const paymentId = vnp_Params.vnp_TxnRef;
    const vnp_ResponseCode = vnp_Params.vnp_ResponseCode;

    if (!isVerified) {
      return res.redirect(
        `/user/payment_status.html?status=failed&message=Hash không hợp lệ`
      );
    }

    const payment = await Payment.findById(paymentId);
    if (!payment)
      return res.redirect(
        `/user/payment_status.html?status=failed&message=Giao dịch không tồn tại`
      );

    // 1. Cập nhật Payment
    payment.vnpayTxnRef = vnp_Params.vnp_TransactionNo;
    payment.vnpayResponseCode = vnp_ResponseCode;

    // 2. Cập nhật Status
    if (vnp_ResponseCode === "00") {
      payment.status = "Success";

      const order = await Order.findById(payment.order);
      if (order && order.status === "Pending") {
        await order.updateStatus("Confirmed", "Thanh toán VNPay thành công");
      }
    } else {
      payment.status = "Failed";
    }
    await payment.save();

    // 3. Chuyển hướng người dùng về trang thông báo
    res.redirect(
      `/user/payment_status.html?status=${payment.status.toLowerCase()}&orderId=${
        payment.order
      }`
    );
  } catch (err) {
    console.error(err);
    res.redirect(
      `/user/payment_status.html?status=error&message=Lỗi xử lý hệ thống`
    );
  }
});

router.put("/:id", Authentication, Authorization("USER"), async (req, res) => {
  // ... (Giữ nguyên logic PUT /:id cũ)
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

// 📍 Lấy danh sách thanh toán (ADMIN) - Bổ sung populate order
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const payments = await Payment.find().populate("order"); // 🎯 Populate Order
    Response(res, 200, true, payments);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
module.exports = router;
