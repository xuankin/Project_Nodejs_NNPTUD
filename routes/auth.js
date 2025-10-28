var express = require("express");
var router = express.Router();
let users = require("../schemas/user");
let roles = require("../schemas/role");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
let { Response } = require("../utils/responseHandler");

// =========================
// 🔹 ĐĂNG KÝ
// =========================
router.post("/register", async (req, res) => {
  try {
    let { username, password, email, fullName, role } = req.body;

    if (!username || !password || !email)
      return Response(res, 400, false, "Thiếu thông tin bắt buộc");

    let exist = await users.findOne({ $or: [{ username }, { email }] });
    if (exist) return Response(res, 400, false, "Tài khoản đã tồn tại");

    let findRole = await roles.findOne({ name: role || "USER" });
    if (!findRole) return Response(res, 400, false, "Role không hợp lệ");

    let newUser = new users({
      username,
      password,
      email,
      fullName,
      role: findRole._id,
    });

    await newUser.save();
    Response(res, 201, true, "Đăng ký thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// =========================
// 🔹 ĐĂNG NHẬP
// =========================
router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    let user = await users.findOne({ username }).populate("role");

    if (!user || user.isDeleted)
      return Response(
        res,
        400,
        false,
        "Tài khoản không tồn tại hoặc đã bị khóa"
      );

    let validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) return Response(res, 400, false, "Sai mật khẩu");
    console.log("DEBUG ROLE:", user.role);

    let token = jwt.sign({ _id: user._id, role: user.role.name }, "NNPTUD", {
      expiresIn: "2h",
    });

    user.loginCount += 1;
    await user.save();

    res.cookie("token", `Bearer ${token}`, { httpOnly: true });
    Response(res, 200, true, {
      token,
      role: user.role.name,
      fullName: user.fullName,
    });
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// =========================
// 🔹 ĐĂNG XUẤT
// =========================
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  Response(res, 200, true, "Đăng xuất thành công");
});

module.exports = router;
