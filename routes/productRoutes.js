// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("../schemas/product");
const Inventory = require("../schemas/inventory");
const Wishlist = require("../schemas/wishlist");
const Review = require("../schemas/review");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// =======================================================
// 📍 LẤY DANH SÁCH (PUBLIC/FRONTEND) - BỔ SUNG INVENTORY STOCK
// =======================================================
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category, sort } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const matchQuery = { isDeleted: false };
    if (category) matchQuery.category = new mongoose.Types.ObjectId(category);
    if (search) matchQuery.name = { $regex: search, $options: "i" };

    const totalCount = await Product.countDocuments(matchQuery);

    let sortStage = { $sort: { createdAt: -1 } };
    if (sort === "price_asc") sortStage = { $sort: { price: 1 } };
    if (sort === "price_desc") sortStage = { $sort: { price: -1 } };

    // --- AGGREGATION PIPELINE ---
    const pipeline = [
      { $match: matchQuery },
      sortStage,
      { $skip: skip },
      { $limit: limitNum },

      // 🎯 0. Look up Inventory và tính toán currentStock (Sửa lỗi đồng bộ)
      {
        $lookup: {
          from: "inventories",
          localField: "_id",
          foreignField: "product",
          as: "inventoryData",
        },
      },
      { $unwind: { path: "$inventoryData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          inventoryStock: { $ifNull: ["$inventoryData.currentStock", 0] },
        },
      },

      // 1. Look up Reviews (Giữ nguyên)
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviews.rating" },
          reviewCount: { $size: "$reviews" },
        },
      },

      // 2. Look up Wishlist (Giữ nguyên)
      {
        $lookup: {
          from: "wishlists",
          localField: "_id",
          foreignField: "products",
          as: "wishlistEntries",
        },
      },
      {
        $addFields: {
          wishlistCount: { $size: "$wishlistEntries" },
        },
      },

      // 3. Populate Category and Seller (Giữ nguyên)
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: "users",
          localField: "seller",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },

      // 4. Project (Dọn dẹp)
      {
        $project: {
          stock: 0, // Loại bỏ trường stock cũ
          inventoryData: 0, // Loại bỏ dữ liệu Inventory thô
          reviews: 0,
          wishlistEntries: 0,
          "seller.password": 0,
          "seller.role": 0,
          "seller.loginCount": 0,
        },
      },
    ];

    let products = await Product.aggregate(pipeline);

    // 5. Kiểm tra User Liked Status (Giữ nguyên)
    if (req.userId) {
      const userWishlist = await Wishlist.findOne({
        user: req.userId,
        isDeleted: false,
      });
      const likedProductIds = userWishlist
        ? userWishlist.products.map((id) => id.toString())
        : [];

      products = products.map((p) => ({
        ...p,
        userLiked: likedProductIds.includes(p._id.toString()),
      }));
    } else {
      products = products.map((p) => ({ ...p, userLiked: false }));
    }

    Response(res, 200, true, {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error("Lỗi list product:", err);
    Response(res, 500, false, err.message);
  }
});

// =======================================================
// 📍 LẤY CHI TIẾT (PUBLIC/ADMIN CRUD) - BỔ SUNG INVENTORY STOCK
// =======================================================
router.get("/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // 🎯 LẤY THÊM DỮ LIỆU TỒN KHO TỪ INVENTORY
    const [product, inventory, reviewStats, wishlistCount, userWishlist] =
      await Promise.all([
        Product.findById(productId).populate("category seller").lean(),
        Inventory.findOne({ product: productId }).lean(), // Lấy tồn kho
        Review.aggregate([
          { $match: { product: new mongoose.Types.ObjectId(productId) } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              reviewCount: { $sum: 1 },
            },
          },
        ]),
        Wishlist.countDocuments({ products: productId, isDeleted: false }),
        req.userId // Vẫn sử dụng req.userId nếu middleware chạy global
          ? Wishlist.findOne({
              user: req.userId,
              products: productId,
              isDeleted: false,
            })
          : Promise.resolve(null),
      ]);

    if (!product || product.isDeleted)
      return Response(res, 404, false, "Sản phẩm không tồn tại");

    const finalProduct = {
      ...product,
      // 🎯 THAY THẾ stock BẰNG currentStock TỪ INVENTORY
      stock: inventory?.currentStock || 0,
      // Thêm thống kê
      avgRating: reviewStats[0]?.avgRating || 0,
      reviewCount: reviewStats[0]?.reviewCount || 0,
      wishlistCount: wishlistCount,
      userLiked: !!userWishlist,
    };

    Response(res, 200, true, finalProduct);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});

// =======================================================
// 📍 THÊM SẢN PHẨM (CRUD) - Giữ nguyên
// =======================================================
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
        stock, // Lưu stock ban đầu vào product.stock (dùng cho update sau này)
        category,
        images,
        seller: req.userId,
      });
      await product.save();

      // 2. Tạo kho
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

// =======================================================
// 📍 CẬP NHẬT SẢN PHẨM (CRUD) - Giữ nguyên
// =======================================================
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

// =======================================================
// 📍 XÓA MỀM (CRUD) - Giữ nguyên
// =======================================================
router.delete(
  "/:id",
  Authentication,
  Authorization("ADMIN", "SELLER"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return Response(res, 404, false, "Không tìm thấy");

      // 1. Xóa mềm sản phẩm
      await product.softDelete();

      // 2. Xóa mềm bản ghi Inventory liên quan
      const inv = await Inventory.findOne({ product: req.params.id });
      if (inv) {
        await inv.softDelete();
      }

      Response(res, 200, true, "Xóa thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);

module.exports = router;
