// routes/users.js
const express = require("express");
const router = express.Router();
const User = require("../schemas/user");
const Role = require("../schemas/role");
const bcrypt = require("bcrypt");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// LẤY THÔNG TIN USER ĐANG ĐĂNG NHẬP
router.get("/me", Authentication, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({ path: "role", select: "name" })
      .select("-password");
    if (!user || user.isDeleted) {
      return Response(res, 404, false, "Người dùng không tồn tại");
    }
    Response(res, 200, true, user);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// Lấy danh sách tất cả user (ADMIN)
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const allUsers = await User.find({ isDeleted: false })
      .populate({ path: "role", select: "name" })
      .select("-password");
    Response(res, 200, true, allUsers);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// Lấy chi tiết user theo ID
router.get("/:id", Authentication, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role")
      .select("-password");
    if (!user || user.isDeleted) {
      return Response(res, 404, false, "Người dùng không tồn tại");
    }

    if (req.userId !== user._id.toString() && req.userRole !== "ADMIN") {
      return Response(res, 403, false, "Bạn không có quyền xem thông tin này");
    }

    Response(res, 200, true, user);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// Tạo user mới (ADMIN, SELLER)
router.post(
  "/",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const { username, email, password, fullName, role } = req.body;
      if (!username || !email || !password) {
        return Response(res, 400, false, "Thiếu thông tin bắt buộc");
      }

      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) return Response(res, 400, false, "Tài khoản đã tồn tại");

      const foundRole = await Role.findOne({ name: role || "USER" });
      if (!foundRole) return Response(res, 400, false, "Role không hợp lệ");

      const hash = bcrypt.hashSync(password, 10);
      const newUser = new User({
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

// Cập nhật user
router.put("/:id", Authentication, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return Response(res, 404, false, "Người dùng không tồn tại");
    }

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
      user.password = bcrypt.hashSync(req.body.password, 10);
    }

    await user.save();
    Response(res, 200, true, "Cập nhật thành công");
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// Xóa mềm
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return Response(res, 404, false, "Không tìm thấy người dùng");

      await user.softDelete();
      Response(res, 200, true, "Xóa mềm người dùng thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

// Khôi phục
router.post(
  "/restore/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id, { includeDeleted: true });
      if (!user) return Response(res, 404, false, "Không tìm thấy người dùng");

      await user.restore();
      Response(res, 200, true, "Khôi phục người dùng thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

module.exports = router;
