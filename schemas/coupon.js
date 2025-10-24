let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    discountPercent: Number,
    validFrom: Date,
    validTo: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

couponSchema.plugin(softDelete);
module.exports = mongoose.model("coupon", couponSchema);
