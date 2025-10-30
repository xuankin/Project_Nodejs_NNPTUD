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
  CreatedResponse,
  BadRequestResponse,
  ServerErrorResponse,
} = require("../utils/responseHandler");
const { validatedResult } = require("../utils/validator");

// ========================================
// POST /orders - Tạo đơn hàng hoàn chỉnh
// ========================================
router.post(
  "/",
  Authentication,
  Authorization("USER"),
  [
    body("paymentMethod")
      .isIn(["COD", "BANK", "MOMO", "ZALOPAY", "CARD"])
      .withMessage("Phương thức thanh toán không hợp lệ"),
    body("couponCode").optional().isString().trim(),
    body("shippingAddress.fullName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Tên người nhận không được để trống"),
    body("shippingAddress.phone")
      .optional()
      .trim()
      .matches(/^[0-9]{10,11}$/)
      .withMessage("Số điện thoại không hợp lệ"),
    body("shippingAddress.address")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Địa chỉ không được để trống"),
  ],
  validatedResult,
  async (req, res) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
      const { couponCode, paymentMethod, shippingAddress, note } = req.body;

      // 1. Lấy giỏ hàng + populate sản phẩm
      const cart = await Cart.findOne({ user: req.userId })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        return BadRequestResponse(res, "Giỏ hàng trống");
      }

      // 2. Tính tổng + kiểm tra tồn kho
      let totalAmount = 0;
      const inventoryUpdates = [];

      for (const item of cart.items) {
        const product = item.product;

        // Kiểm tra sản phẩm còn tồn tại không
        if (!product || product.isDeleted) {
          throw new Error(
            `Sản phẩm "${product?.name || "Unknown"}" không còn tồn tại`
          );
        }

        // Kiểm tra tồn kho
        const inv = await Inventory.findOne({ product: product._id }).session(
          session
        );

        if (!inv || inv.currentStock < item.quantity) {
          throw new Error(
            `Sản phẩm "${product.name}" không đủ hàng (còn ${
              inv?.currentStock || 0
            })`
          );
        }

        totalAmount += product.price * item.quantity;

        // Chuẩn bị cập nhật kho (atomic operation)
        inventoryUpdates.push({
          updateOne: {
            filter: {
              product: product._id,
              currentStock: { $gte: item.quantity },
            },
            update: {
              $inc: {
                quantityOut: item.quantity,
                currentStock: -item.quantity,
              },
            },
          },
        });
      }

      // 3. Áp dụng coupon (nếu có)
      let discountAmount = 0;
      let appliedCoupon = null;

      if (couponCode) {
        appliedCoupon = await Coupon.findOne({
          code: couponCode.toUpperCase(),
          isActive: true,
          validTo: { $gt: new Date() },
        }).session(session);

        if (!appliedCoupon) {
          await session.abortTransaction();
          return BadRequestResponse(
            res,
            "Mã giảm giá không hợp lệ hoặc đã hết hạn"
          );
        }

        // ✅ Sử dụng method từ coupon schema
        try {
          discountAmount = appliedCoupon.calculateDiscount(totalAmount);

          // Tăng số lần sử dụng
          appliedCoupon.usedCount += 1;
          await appliedCoupon.save({ session });
        } catch (err) {
          await session.abortTransaction();
          return BadRequestResponse(res, err.message);
        }
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);

      // 4. Tạo đơn hàng
      const order = new Order({
        user: req.userId,
        items: cart.items.map((i) => ({
          product: i.product._id,
          quantity: i.quantity,
          price: i.product.price,
        })),
        totalAmount,
        discountAmount,
        finalAmount,
        coupon: appliedCoupon?._id || null,
        status: "Pending",
        paymentMethod,
        shippingAddress,
        note,
      });

      await order.save({ session });

      // 5. Cập nhật kho (atomic)
      if (inventoryUpdates.length > 0) {
        const bulkResult = await Inventory.bulkWrite(inventoryUpdates, {
          session,
        });

        // Kiểm tra có cập nhật đủ không
        if (bulkResult.modifiedCount !== inventoryUpdates.length) {
          throw new Error(
            "Không thể cập nhật tồn kho - Có thể sản phẩm đã hết hàng"
          );
        }
      }

      // 6. Xóa giỏ hàng
      await Cart.deleteOne({ user: req.userId }).session(session);

      // 7. Commit transaction
      await session.commitTransaction();

      // 8. Populate & trả về
      const populatedOrder = await Order.findById(order._id)
        .populate("user", "fullName email phone")
        .populate("items.product", "name images price")
        .populate("coupon", "code discountType discountValue");

      return CreatedResponse(res, populatedOrder, "Đặt hàng thành công");
    } catch (err) {
      await session.abortTransaction();
      console.error("Order creation failed:", err);
      return ServerErrorResponse(res, err, "Tạo đơn hàng thất bại");
    } finally {
      session.endSession();
    }
  }
);

// ========================================
// GET /orders/me - Lịch sử đơn hàng (USER)
// ========================================
router.get("/me", Authentication, Authorization("USER"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status; // Filter theo status

    // Build query
    const query = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("items.product", "name images price")
      .populate("coupon", "code discountType discountValue")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    Response(res, 200, true, {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// ========================================
// GET /orders/:id - Chi tiết đơn hàng
// ========================================
router.get("/:id", Authentication, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "fullName email phone")
      .populate("items.product", "name images price")
      .populate("coupon", "code discountType discountValue");

    if (!order) {
      return Response(res, 404, false, null, "Không tìm thấy đơn hàng");
    }

    // Chỉ cho phép user sở hữu hoặc ADMIN xem
    if (order.user._id.toString() !== req.userId && req.userRole !== "ADMIN") {
      return Response(
        res,
        403,
        false,
        null,
        "Bạn không có quyền xem đơn hàng này"
      );
    }

    Response(res, 200, true, order);
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// ========================================
// GET /orders - Quản trị viên xem tất cả
// ========================================
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("user", "fullName email phone")
      .populate("items.product", "name")
      .populate("coupon", "code")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // Thống kê theo status
    const statusStats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    Response(res, 200, true, {
      orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: statusStats,
    });
  } catch (err) {
    ServerErrorResponse(res, err);
  }
});

// ========================================
// PUT /orders/:id/status - Cập nhật trạng thái (ADMIN)
// ========================================
router.put(
  "/:id/status",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const { status, reason } = req.body;

      if (!status) {
        return BadRequestResponse(res, "Thiếu trạng thái");
      }

      const order = await Order.findById(req.params.id);
      if (!order) {
        return Response(res, 404, false, null, "Không tìm thấy đơn hàng");
      }

      // ✅ Sử dụng method từ schema
      await order.updateStatus(status, reason);

      Response(res, 200, true, order, "Cập nhật trạng thái thành công");
    } catch (err) {
      ServerErrorResponse(res, err);
    }
  }
);

// ========================================
// POST /orders/:id/cancel - Hủy đơn hàng (USER)
// ========================================
router.post(
  "/:id/cancel",
  Authentication,
  Authorization("USER"),
  async (req, res) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
      const { reason } = req.body;
      const order = await Order.findById(req.params.id).session(session);

      if (!order) {
        await session.abortTransaction();
        return Response(res, 404, false, null, "Không tìm thấy đơn hàng");
      }

      // Kiểm tra ownership
      if (order.user.toString() !== req.userId) {
        await session.abortTransaction();
        return Response(
          res,
          403,
          false,
          null,
          "Bạn không có quyền hủy đơn hàng này"
        );
      }

      // Chỉ có thể hủy đơn Pending hoặc Confirmed
      if (!["Pending", "Confirmed"].includes(order.status)) {
        await session.abortTransaction();
        return BadRequestResponse(
          res,
          "Không thể hủy đơn hàng ở trạng thái này"
        );
      }

      // Hoàn trả tồn kho
      const inventoryRestores = order.items.map((item) => ({
        updateOne: {
          filter: { product: item.product },
          update: {
            $inc: {
              quantityOut: -item.quantity,
              currentStock: item.quantity,
            },
          },
        },
      }));

      await Inventory.bulkWrite(inventoryRestores, { session });

      // Cập nhật trạng thái đơn hàng
      await order.updateStatus("Cancelled", reason || "Người dùng hủy đơn");

      await session.commitTransaction();

      Response(res, 200, true, order, "Hủy đơn hàng thành công");
    } catch (err) {
      await session.abortTransaction();
      ServerErrorResponse(res, err);
    } finally {
      session.endSession();
    }
  }
);

module.exports = router;
