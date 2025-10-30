// routes/orderRoutes.js
const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const Order = require("../schemas/order");
const Cart = require("../schemas/cart");
const Inventory = require("../schemas/inventory");
const Coupon = require("../schemas/coupon");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const {
  Response,
  BadRequestResponse,
  ServerErrorResponse,
} = require("../utils/responseHandler");
const { validatedResult } = require("../utils/validator");

// POST /orders - Tạo đơn hàng (Giữ nguyên, nhưng lưu ý: Không dùng Transaction)
router.post(
  "/",
  Authentication,
  Authorization("USER"),
  [
    body("paymentMethod").isIn(["COD", "BANK", "MOMO", "ZALOPAY", "CARD"]),
    body("couponCode").optional().isString().trim(),
    body("shippingAddress.fullName").optional().trim().notEmpty(),
    body("shippingAddress.phone")
      .optional()
      .matches(/^[0-9]{10,11}$/),
    body("shippingAddress.address").optional().trim().notEmpty(),
  ],
  validatedResult,
  async (req, res) => {
    try {
      const { couponCode, paymentMethod, shippingAddress, note } = req.body;

      // 1. Lấy giỏ hàng
      const cart = await Cart.findOne({ user: req.userId }).populate(
        "items.product"
      );
      if (!cart || cart.items.length === 0) {
        return BadRequestResponse(res, "Giỏ hàng trống");
      }

      // 2. KIỂM TRA KHO
      let totalAmount = 0;
      for (const item of cart.items) {
        const inv = await Inventory.findOne({ product: item.product._id });
        if (!inv || inv.currentStock < item.quantity) {
          return BadRequestResponse(
            res,
            `Không đủ hàng: ${item.product.name} (còn ${
              inv?.currentStock || 0
            })`
          );
        }
        totalAmount += item.product.price * item.quantity;
      }

      // 3. Áp dụng coupon
      let discount = 0;
      if (couponCode) {
        const coupon = await Coupon.findOne({
          code: couponCode,
          validTo: { $gte: new Date() },
        });
        if (coupon) {
          discount = Math.min(
            coupon.discountValue,
            totalAmount * (coupon.maxDiscount / 100 || 1)
          );
          totalAmount -= discount;
        }
      }

      // 4. Tạo đơn hàng
      const order = new Order({
        user: req.userId,
        items: cart.items.map((i) => ({
          product: i.product._id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        totalAmount,
        finalAmount: totalAmount,
        discount,
        paymentMethod,
        shippingAddress,
        note,
        status: "Pending",
      });
      await order.save();

      // 5. TRỪ KHO
      for (const item of cart.items) {
        await Inventory.updateOne(
          { product: item.product._id },
          { $inc: { currentStock: -item.quantity, quantityOut: item.quantity } }
        );
      }

      // 6. XÓA GIỎ HÀNG
      await Cart.deleteOne({ user: req.userId });

      Response(res, 201, true, order, "Đặt hàng thành công");
    } catch (err) {
      ServerErrorResponse(res, err);
    }
  }
);

// GET /orders/me - Lịch sử đơn hàng (Giữ nguyên)
router.get("/me", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = { user: req.userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    Response(res, 200, true, {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// GET /orders/:id - Chi tiết đơn (Giữ nguyên)
router.get("/:id", Authentication, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "fullName email phone")
      .populate("items.product", "name images price");

    if (!order) return Response(res, 404, false, "Không tìm thấy đơn hàng");
    if (order.user._id.toString() !== req.userId && req.userRole !== "ADMIN") {
      return Response(res, 403, false, "Không có quyền");
    }

    Response(res, 200, true, order);
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// GET /orders - ADMIN (Giữ nguyên)
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query = status ? { status } : {};

    const orders = await Order.find(query)
      .populate("user", "fullName")
      .populate("items.product", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    Response(res, 200, true, {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// PUT /orders/:id/status - ADMIN (Giữ nguyên)
router.put(
  "/:id/status",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const { status, reason } = req.body;
      if (!status) return BadRequestResponse(res, "Thiếu trạng thái");

      const order = await Order.findById(req.params.id);
      if (!order) return Response(res, 404, false, "Không tìm thấy");

      // Giả định order.updateStatus là một method có sẵn
      await order.updateStatus(status, reason);
      Response(res, 200, true, order, "Cập nhật thành công");
    } catch (err) {
      ServerErrorResponse(res, err);
    }
  }
);

// POST /orders/:id/cancel - USER (HOÀN KHO)
router.post(
  "/:id/cancel",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    try {
      const { reason } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) return Response(res, 404, false, "Không tìm thấy");
      if (order.user.toString() !== req.userId)
        return Response(res, 403, false, "Không có quyền");
      if (!["Pending", "Confirmed"].includes(order.status)) {
        return BadRequestResponse(res, "Không thể hủy trạng thái này");
      }

      // HOÀN KHO
      for (const item of order.items) {
        await Inventory.updateOne(
          { product: item.product },
          {
            // 🎯 CHỈNH SỬA: Tăng currentStock và giảm quantityOut (vì hàng được hoàn về)
            $inc: {
              currentStock: item.quantity,
              quantityOut: -item.quantity,
            },
          }
        );
      }

      // Giả định order.updateStatus là một method có sẵn
      await order.updateStatus("Cancelled", reason || "Người dùng hủy");
      Response(res, 200, true, order, "Hủy thành công");
    } catch (err) {
      ServerErrorResponse(res, err);
    }
  }
);

module.exports = router;
