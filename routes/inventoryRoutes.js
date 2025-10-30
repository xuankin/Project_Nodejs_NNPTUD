const express = require("express");
const router = express.Router();
const Inventory = require("../schemas/inventory");
const { Authentication, Authorization } = require("../utils/authMiddleware");
const { Response } = require("../utils/responseHandler");

// 📍 Lấy toàn bộ kho hàng
router.get("/", Authentication, Authorization("ADMIN"), async (req, res) => {
  try {
    const data = await Inventory.find().populate("product");
    Response(res, 200, true, data);
  } catch (err) {
    Response(res, 500, false, err.message);
  }
});
// Cập nhật kho thủ công (ADMIN)
router.put(
  "/:productId",
  Authentication,
  Authorization("ADMIN"),
  async (req, res) => {
    try {
      let inv = await Inventory.findOne({ product: req.params.productId });
      if (!inv) {
        inv = new Inventory({ product: req.params.productId, currentStock: 0 });
      }
      inv.quantityIn += req.body.quantityIn || 0;
      inv.quantityOut += req.body.quantityOut || 0;
      inv.currentStock +=
        (req.body.quantityIn || 0) - (req.body.quantityOut || 0);
      await inv.save();
      Response(res, 200, true, "Cập nhật tồn kho thành công");
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  }
);
module.exports = router;
