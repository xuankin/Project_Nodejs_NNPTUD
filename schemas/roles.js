let mongoose = require("mongoose");

let roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("role", roleSchema);
