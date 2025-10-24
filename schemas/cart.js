let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

cartSchema.plugin(softDelete);
module.exports = mongoose.model("cart", cartSchema);
