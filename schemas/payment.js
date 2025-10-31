// schemas/payment.js
let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let paymentSchema = new mongoose.Schema(
  {
    order: {
      // 🎯 BỔ SUNG: Liên kết với Order
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    method: { type: String, required: true },
    transactionId: String,

    // 🎯 BỔ SUNG CÁC TRƯỜNG VNPAY
    vnpayTxnRef: String, // Mã giao dịch của VNPay
    vnpayResponseCode: String, // Mã phản hồi từ VNPay (00 là thành công)

    amount: Number,
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

paymentSchema.plugin(softDelete);
module.exports = mongoose.model("payment", paymentSchema);
