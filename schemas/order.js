let mongoose = require("mongoose");

let orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        quantity: Number,
        price: Number,
      },
    ],
    totalPrice: Number,
    shippingAddress: String,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "payment" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("order", orderSchema);
