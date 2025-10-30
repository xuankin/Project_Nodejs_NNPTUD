const Response = (res, statusCode, success, data, message) => {
  res.status(statusCode).send({
    success: success,
    data: data || null,
    message: message || (success ? "Thành công" : "Thất bại"),
  });
};

const BadRequestResponse = (res, message) => {
  Response(res, 400, false, null, message || "Yêu cầu không hợp lệ");
};

const ServerErrorResponse = (res, err) => {
  console.error("Internal Server Error:", err);
  // Có thể trả về thông báo lỗi chi tiết trong môi trường dev,
  // nhưng trong môi trường production chỉ nên trả về lỗi chung chung.
  Response(res, 500, false, null, err.message || "Lỗi máy chủ nội bộ");
};

module.exports = {
  Response,
  BadRequestResponse,
  ServerErrorResponse, // 🎯 Đã thêm hàm này vào module.exports
};
