let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    quantityIn: Number,
    quantityOut: Number,
    currentStock: Number,
  },
  { timestamps: true }
);

inventorySchema.plugin(softDelete);
module.exports = mongoose.model("inventory", inventorySchema);
