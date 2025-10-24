let mongoose = require("mongoose");

let categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    imageURL: { type: String },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("category", categorySchema);
