// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const Product = require("../schemas/product");
const Inventory = require("../schemas/inventory");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// LẤY DANH SÁCH
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).populate(
      "category seller"
    );
    Response(res, 200, true, products);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// LẤY CHI TIẾT
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

// THÊM SẢN PHẨM – KHÔNG DÙNG TRANSACTION
router.post(
  "/",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const { name, description, price, stock, category, images } = req.body;

      // 1. Tạo sản phẩm
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

      // 2. Tạo kho (nếu lỗi → vẫn giữ sản phẩm)
      try {
        const existingInv = await Inventory.findOne({ product: product._id });
        if (!existingInv) {
          const inventory = new Inventory({
            product: product._id,
            currentStock: stock || 0,
            quantityIn: stock || 0,
            quantityOut: 0,
          });
          await inventory.save();
        }
      } catch (invErr) {
        console.warn("Tạo kho thất bại:", invErr.message);
      }

      Response(res, 201, true, "Tạo sản phẩm thành công");
    } catch (err) {
      console.error("Lỗi tạo sản phẩm:", err);
      Response(res, 500, false, err.message);
    }
  }
);

// CẬP NHẬT SẢN PHẨM – KHÔNG DÙNG TRANSACTION
router.put(
  "/:id",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product || product.isDeleted)
        return Response(res, 404, false, "Không tìm thấy");

      const oldStock = product.stock;
      Object.assign(product, req.body);
      await product.save();

      // Đồng bộ kho nếu stock thay đổi
      if (req.body.stock !== undefined && req.body.stock !== oldStock) {
        let inv = await Inventory.findOne({ product: product._id });
        if (!inv) {
          inv = new Inventory({
            product: product._id,
            currentStock: 0,
            quantityIn: 0,
            quantityOut: 0,
          });
        }
        const diff = (req.body.stock || 0) - (oldStock || 0);
        inv.currentStock += diff;
        inv.quantityIn += diff > 0 ? diff : 0;
        inv.quantityOut += diff < 0 ? Math.abs(diff) : 0;
        await inv.save();
      }

      Response(res, 200, true, "Cập nhật thành công");
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
      Response(res, 500, false, err.message);
    }
  }
);

// XÓA MỀM
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return Response(res, 404, false, "Không tìm thấy");
      await product.softDelete();
      Response(res, 200, true, "Xóa thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

module.exports = router;
