const express = require("express");
const router = express.Router();
const Product = require("../schemas/product");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy danh sách sản phẩm (mọi người đều xem được)
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("category seller");
    Response(res, 200, true, products);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Lấy chi tiết sản phẩm
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "category seller"
    );
    if (!product || product.isDeleted)
      return Response(res, 404, false, "Sản phẩm không tồn tại");
    Response(res, 200, true, product);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// 📍 Thêm sản phẩm (ADMIN, SELLER)
router.post(
  "/",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const { name, description, price, stock, category, images } = req.body;
      const product = new Product({
        name,
        description,
        price,
        stock,
        category,
        images,
        seller: req.userId,
      });
      await product.save();
      Response(res, 201, true, "Tạo sản phẩm thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

// 📍 Cập nhật sản phẩm (ADMIN, SELLER)
router.put(
  "/:id",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || product.isDeleted)
        return Response(res, 404, false, "Không tìm thấy sản phẩm");

      Object.assign(product, req.body);
      await product.save();
      Response(res, 200, true, "Cập nhật sản phẩm thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

// 📍 Xóa mềm sản phẩm
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return Response(res, 404, false, "Không tìm thấy sản phẩm");

      await product.softDelete();
      Response(res, 200, true, "Xóa sản phẩm thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

module.exports = router;
