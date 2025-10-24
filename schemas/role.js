let mongoose = require("mongoose");
let softDelete = require("./plugins/softDelete");

let roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [String],
  },
  { timestamps: true }
);

roleSchema.plugin(softDelete);
module.exports = mongoose.model("role", roleSchema);
