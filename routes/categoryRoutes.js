const express = require("express");
const router = express.Router();
const Category = require("../schemas/category");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy tất cả danh mục
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find().populate("parentCategory");
    Response(res, 200, true, categories);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Tạo danh mục
router.post("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const { name, description, imageURL, parentCategory } = req.body;
    const cat = new Category({ name, description, imageURL, parentCategory });
    await cat.save();
    Response(res, 201, true, "Tạo danh mục thành công");
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Xóa mềm danh mục
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      const cat = await Category.findById(req.params.id);
      if (!cat) return Response(res, 404, false, "Không tìm thấy danh mục");
      await cat.softDelete();
      Response(res, 200, true, "Xóa danh mục thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

module.exports = router;
