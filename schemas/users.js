let mongoose = require("mongoose");
let bcrypt = require("bcrypt");
let softDelete = require("./plugins/softDelete");

let userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, default: "" },
    avatarURL: { type: String, default: "" },
    loginCount: { type: Number, default: 0 },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "role" },
    forgotPasswordToken: String,
    forgotPasswordTokenExp: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (this.isModified("password")) {
    let salt = bcrypt.genSaltSync(10);
    this.password = bcrypt.hashSync(this.password, salt);
  }
  next();
});

userSchema.plugin(softDelete);
module.exports = mongoose.model("user", userSchema);
