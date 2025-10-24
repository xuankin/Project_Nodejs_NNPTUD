let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

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

paymentSchema.plugin(softDelete);
module.exports = mongoose.model("payment", paymentSchema);
