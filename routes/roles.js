var express = require("express");
var router = express.Router();
let roles = require("../schemas/role");
let { Authentication, Authorization } = require("../utils/authMiddleware");
let { Response } = require("../utils/responseHandler");

// =============================
// 🔹 Lấy tất cả role (chỉ ADMIN)
// =============================
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    let allRoles = await roles.find({ isDeleted: false });
    Response(res, 200, true, allRoles);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Lấy role theo ID (chỉ ADMIN)
// =============================
router.get("/:id", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    let role = await roles.findById(req.params.id);
    if (!role || role.isDeleted)
      return Response(res, 404, false, "Role không tồn tại");
    Response(res, 200, true, role);
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Tạo role mới (chỉ ADMIN)
// =============================
router.post("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    let { name, permissions } = req.body;
    if (!name) return Response(res, 400, false, "Thiếu tên role");

    let exist = await roles.findOne({ name });
    if (exist) return Response(res, 400, false, "Role đã tồn tại");

    let newRole = new roles({ name, permissions });
    await newRole.save();

    Response(res, 201, true, "Tạo role thành công");
  } catch (error) {
    Response(res, 500, false, error.message);
  }
});

// =============================
// 🔹 Xóa mềm role (chỉ ADMIN)
// =============================
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      let role = await roles.findById(req.params.id);
      if (!role) return Response(res, 404, false, "Không tìm thấy role");

      // 🎯 BỔ SUNG: KIỂM TRA PHỤ THUỘC TỪ USER
      const User = require("../schemas/user"); // Cần import User
      const userCount = await User.countDocuments({
        role: req.params.id,
        isDeleted: false,
      });

      if (userCount > 0) {
        return Response(
          res,
          400,
          false,
          `Không thể xóa: Có ${userCount} người dùng đang có vai trò này`
        );
      }
      // 🎯 KẾT THÚC BỔ SUNG

      await role.softDelete();
      Response(res, 200, true, "Xóa mềm role thành công");
    } catch (error) {
      Response(res, 500, false, error.message);
    }
  }
);

module.exports = router;
