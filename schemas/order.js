const mongoose = require("mongoose");
const softDelete = require("./plugins/softDelete");

const orderSchema = new mongoose.Schema(
  {
    // Người dùng đặt hàng
    user: {
      type: mongoose.Schema.Types.ObjectId,
      // 🎯 SỬA: Dùng tên model viết thường (user)
      ref: "user",
      required: true,
    },

    // Danh sách sản phẩm trong đơn
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          // 🎯 SỬA: Dùng tên model viết thường (product)
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
      // 🎯 SỬA: Dùng tên model viết thường (coupon)
      ref: "coupon",
      default: null,
    },

    // Trạng thái đơn hàng
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"],
      default: "Pending",
    },

    // Phương thức thanh toán
    paymentMethod: {
      type: String,
      enum: ["COD", "BANK", "MOMO", "ZALOPAY", "CARD"],
      required: true,
    },

    // Ghi chú thêm (nếu cần)
    note: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

orderSchema.plugin(softDelete);
orderSchema.index({ user: 1, status: 1, createdAt: -1 });

// 🎯 SỬA: Export tên model thành "order" (chữ thường) để thống nhất
module.exports = mongoose.model("order", orderSchema);
