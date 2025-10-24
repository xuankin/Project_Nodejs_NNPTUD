let mongoose = require("mongoose");

let reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("review", reviewSchema);
