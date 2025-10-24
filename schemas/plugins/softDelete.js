// schemas/plugins/softDelete.js
module.exports = function softDeletePlugin(schema) {
  // Thêm 2 trường cho tất cả schema
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  });

  // Middleware: luôn loại bỏ bản ghi đã xóa
  schema.pre(/^find/, function (next) {
    if (!this.getFilter().includeDeleted) {
      this.where({ isDeleted: false });
    }
    next();
  });

  // Hàm hỗ trợ "xóa mềm"
  schema.methods.softDelete = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    await this.save();
  };

  // Hàm hỗ trợ "khôi phục"
  schema.methods.restore = async function () {
    this.isDeleted = false;
    this.deletedAt = null;
    await this.save();
  };
};
