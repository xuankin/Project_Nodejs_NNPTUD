let mongoose = require("mongoose");

let inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    quantityIn: Number,
    quantityOut: Number,
    currentStock: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("inventory", inventorySchema);
