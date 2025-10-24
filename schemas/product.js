let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    images: [String],
    category: { type: mongoose.Schema.Types.ObjectId, ref: "category" },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

productSchema.plugin(softDelete);
module.exports = mongoose.model("product", productSchema);
