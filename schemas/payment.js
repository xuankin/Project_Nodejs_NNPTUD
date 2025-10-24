let mongoose = require("mongoose");

let paymentSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    transactionId: String,
    amount: Number,
    status: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("payment", paymentSchema);
