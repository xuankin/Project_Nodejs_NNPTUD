let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    imageURL: String,
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
  },
  { timestamps: true }
);

categorySchema.plugin(softDelete);
module.exports = mongoose.model("category", categorySchema);
