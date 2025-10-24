var express = require("express");
var router = express.Router();
let users = require("../schemas/user");
let roles = require("../schemas/role");
let bcrypt = require("bcrypt");
let { Authentication, Authorization } = require("../utils/authMiddleware");
let { Response } = require("../utils/responseHandler");

// =============================
// 🔹 Lấy danh sách tất cả user (chỉ ADMIN)
// =============================
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    let allUsers = await users
      .find({ isDeleted: false })
      .populate({ path: "role", select: "name" });
    Response(res, 200, true, allUsers);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Lấy thông tin chi tiết user theo ID (ADMIN hoặc chính user đó)
// =============================
router.get("/:id", Authentication, async (req, res) => {
  try {
    let user = await users.findById(req.params.id).populate("role");
    if (!user || user.isDeleted)
      return Response(res, 404, false, "Người dùng không tồn tại");

    // Chỉ cho phép ADMIN hoặc chính user đó xem thông tin
    if (req.userId !== user._id.toString() && req.userRole !== "ADMIN") {
      return Response(res, 403, false, "Bạn không có quyền xem thông tin này");
    }

    Response(res, 200, true, user);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Tạo mới user (ADMIN hoặc SELLER)
// =============================
router.post(
  "/",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      let { username, email, password, fullName, role } = req.body;
      if (!username || !email || !password)
        return Response(res, 400, false, "Thiếu thông tin bắt buộc");

      // Kiểm tra trùng username/email
      let exists = await users.findOne({ $or: [{ username }, { email }] });
      if (exists) return Response(res, 400, false, "Tài khoản đã tồn tại");

      let foundRole = await roles.findOne({ name: role || "USER" });
      if (!foundRole) return Response(res, 400, false, "Role không hợp lệ");

      // Mã hóa mật khẩu
      let hash = bcrypt.hashSync(password, 10);

      let newUser = new users({
        username,
        email,
        password: hash,
        fullName,
        role: foundRole._id,
      });

      await newUser.save();
      Response(res, 201, true, "Tạo người dùng thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

// =============================
// 🔹 Cập nhật thông tin người dùng (ADMIN hoặc chính user đó)
// =============================
router.put("/:id", Authentication, async (req, res) => {
  try {
    let user = await users.findById(req.params.id);
    if (!user || user.isDeleted)
      return Response(res, 404, false, "Người dùng không tồn tại");

    // Chỉ cho phép ADMIN hoặc chính user đó cập nhật
    if (req.userId !== user._id.toString() && req.userRole !== "ADMIN") {
      return Response(
        res,
        403,
        false,
        "Bạn không thể sửa thông tin người khác"
      );
    }

    user.email = req.body.email || user.email;
    user.fullName = req.body.fullName || user.fullName;

    if (req.body.password) {
      let salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(req.body.password, salt);
    }

    await user.save();
    Response(res, 200, true, "Cập nhật thành công");
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Xóa mềm người dùng (chỉ ADMIN)
// =============================
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      let user = await users.findById(req.params.id);
      if (!user) return Response(res, 404, false, "Không tìm thấy người dùng");

      await user.softDelete();
      Response(res, 200, true, "Xóa mềm người dùng thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

// =============================
// 🔹 Khôi phục người dùng (chỉ ADMIN)
// =============================
router.post(
  "/restore/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      let user = await users.findById(req.params.id, { includeDeleted: true });
      if (!user) return Response(res, 404, false, "Không tìm thấy người dùng");

      await user.restore();
      Response(res, 200, true, "Khôi phục người dùng thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

module.exports = router;
