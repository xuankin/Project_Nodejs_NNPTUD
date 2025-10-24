let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "product" }],
  },
  { timestamps: true }
);

wishlistSchema.plugin(softDelete);
module.exports = mongoose.model("wishlist", wishlistSchema);
