let mongoose = require("mongoose");

let notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    message: String,
    type: {
      type: String,
      enum: ["Order", "System", "Promotion"],
      default: "System",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("notification", notificationSchema);
