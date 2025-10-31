// schemas/order.js
const mongoose = require("mongoose");
const softDelete = require("./plugins/softDelete");

const orderSchema = new mongoose.Schema(
  {
    // Người dùng đặt hàng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    // Danh sách sản phẩm trong đơn
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],

    // Tổng tiền trước giảm giá
    totalAmount: { type: Number, required: true, min: 0 },

    // Số tiền giảm giá
    discountAmount: { type: Number, default: 0, min: 0 },

    // Số tiền thực thanh toán (sau giảm giá)
    finalAmount: { type: Number, required: true, min: 0 },

    // Mã giảm giá áp dụng (nếu có)
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "coupon",
      default: null,
    },

    // Trạng thái đơn hàng
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // 🎯 BỔ SUNG: Lịch sử thay đổi trạng thái
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"],
        },
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],

    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "BANK", "MOMO", "ZALOPAY", "CARD", "VNPAY"], // 🎯 BỔ SUNG VNPAY
      required: true,
    },

    // 🎯 BỔ SUNG: Liên kết với Payment
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment",
      default: null,
    },

    // Ghi chú thêm (nếu cần)
    note: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// 🎯 BỔ SUNG: Định nghĩa phương thức instance (Method) updateStatus
orderSchema.methods.updateStatus = async function (newStatus, reason = null) {
  // 1. Cập nhật trạng thái hiện tại
  this.status = newStatus;

  // 2. Lưu lịch sử trạng thái
  this.statusHistory.push({
    status: newStatus,
    reason: reason,
  });

  // 3. Lưu tài liệu
  await this.save();
};

orderSchema.plugin(softDelete);
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("order", orderSchema);
