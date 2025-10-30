let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let couponSchema = new mongoose.Schema(
  {
    // Mã giảm giá (phải unique)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Loại giảm giá: phần trăm hoặc số tiền cố định
    discountType: {
      type: String,
      enum: ["percent", "fixed"],
      required: true,
    },

    // Giá trị giảm (% hoặc số tiền)
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Giảm tối đa (chỉ áp dụng cho discountType = "percent")
    // Ví dụ: giảm 20% nhưng tối đa 100k
    maxDiscount: {
      type: Number,
      min: 0,
      default: null,
    },

    // Giá trị đơn hàng tối thiểu để áp dụng
    minAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Thời gian hiệu lực
    validFrom: {
      type: Date,
      default: Date.now,
    },

    validTo: {
      type: Date,
      required: true,
    },

    // Trạng thái kích hoạt
    isActive: {
      type: Boolean,
      default: true,
    },

    // Số lần sử dụng tối đa (optional)
    maxUsage: {
      type: Number,
      min: 0,
      default: null,
    },

    // Số lần đã sử dụng
    usedCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index để query nhanh

couponSchema.index({ isActive: 1, validTo: 1 });

// Method kiểm tra coupon còn hiệu lực không
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    this.validFrom <= now &&
    this.validTo >= now &&
    (!this.maxUsage || this.usedCount < this.maxUsage)
  );
};

// Method tính số tiền giảm
couponSchema.methods.calculateDiscount = function (totalAmount) {
  if (!this.isValid()) {
    throw new Error("Mã giảm giá không hợp lệ");
  }

  if (this.minAmount && totalAmount < this.minAmount) {
    throw new Error(`Đơn hàng phải từ ${this.minAmount}đ để dùng mã này`);
  }

  let discount = 0;

  if (this.discountType === "percent") {
    discount = (totalAmount * this.discountValue) / 100;

    // Giới hạn giảm tối đa
    if (this.maxDiscount) {
      discount = Math.min(discount, this.maxDiscount);
    }
  } else {
    discount = this.discountValue;
  }

  // Đảm bảo không giảm quá tổng tiền
  return Math.min(discount, totalAmount);
};

couponSchema.plugin(softDelete);

module.exports = mongoose.model("coupon", couponSchema);
