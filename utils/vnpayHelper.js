// utils/vnpayHelper.js
/**
 * VNPay Helper – Cho phép người dùng TỰ CHỌN NGÂN HÀNG
 * - Không ép vnp_BankCode → tránh lỗi "Ngân hàng không được hỗ trợ"
 * - Hỗ trợ tất cả thẻ test VNPay Sandbox
 * - Tương thích 100% với paymentRoutes.js & orderRoutes.js
 */

const crypto = require("crypto");
const querystring = require("qs");
const moment = require("moment");

// Đảm bảo require('dotenv').config() ở file khởi động (app.js)
const vnpayConfig = {
  vnp_TmnCode: process.env.VNP_TMNCODE?.trim(),
  vnp_HashSecret: process.env.VNP_HASHSECRET?.trim(),
  vnp_Url: process.env.VNP_URL?.trim(),
  vnp_ReturnUrl: process.env.VNP_RETURN_URL?.trim(),
};

// Sắp xếp object theo key (yêu cầu VNPay)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

/**
 * Tạo URL thanh toán VNPay – Người dùng TỰ CHỌN NGÂN HÀNG
 * @param {object} params - { amount, txnRef, ip }
 * @returns {string} URL thanh toán
 */
function createPaymentUrl({ amount, txnRef, ip }) {
  // Kiểm tra config
  if (
    !vnpayConfig.vnp_TmnCode ||
    !vnpayConfig.vnp_HashSecret ||
    !vnpayConfig.vnp_Url ||
    !vnpayConfig.vnp_ReturnUrl
  ) {
    throw new Error(
      "VNPAY config missing. Check .env: VNP_TMNCODE, VNP_HASHSECRET, VNP_URL, VNP_RETURN_URL"
    );
  }

  const createDate = moment().format("YYYYMMDDHHmmss");
  const expireDate = moment().add(15, "minutes").format("YYYYMMDDHHmmss");

  // Chuẩn hóa IP
  const cleanIp = ip && ip.includes(":") ? "127.0.0.1" : ip || "127.0.0.1";

  // Số tiền: làm tròn + nhân 100
  const finalAmount = Math.round(Number(amount)) * 100;

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ${txnRef}`,
    vnp_OrderType: "other",

    // KHÔNG GỬI vnp_BankCode → TỰ CHỌN NGÂN HÀNG
    // vnp_BankCode: "NCB",  ← ĐÃ XÓA

    vnp_Amount: finalAmount,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
    vnp_IpAddr: cleanIp,
    vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
  };

  // Sắp xếp tham số
  vnp_Params = sortObject(vnp_Params);

  // Tạo chuỗi hash
  let signData = "";
  for (const key in vnp_Params) {
    const value = vnp_Params[key];
    if (value !== null && value !== undefined && value !== "") {
      signData += `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}&`;
    }
  }
  signData = signData.slice(0, -1); // Xóa & cuối

  // Tạo chữ ký SHA512
  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const vnp_SecureHash = hmac.update(signData).digest("hex");

  vnp_Params.vnp_SecureHash = vnp_SecureHash;

  // Trả về URL
  return (
    vnpayConfig.vnp_Url +
    "?" +
    querystring.stringify(vnp_Params, { encode: true })
  );
}

/**
 * Xác thực chữ ký trả về từ VNPay
 * @param {object} vnp_Params - Query params từ VNPay
 * @returns {{ isVerified: boolean, message?: string }}
 */
function verifyReturnUrl(vnp_Params) {
  if (!vnpayConfig.vnp_HashSecret) {
    throw new Error("VNPAY Hash Secret missing.");
  }

  const secureHash = vnp_Params.vnp_SecureHash;
  if (!secureHash) {
    return { isVerified: false, message: "Thiếu vnp_SecureHash" };
  }

  // Xóa các field không dùng để hash
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  vnp_Params = sortObject(vnp_Params);

  let signData = "";
  for (const key in vnp_Params) {
    const value = vnp_Params[key];
    if (value !== null && value !== undefined && value !== "") {
      signData += `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}&`;
    }
  }
  signData = signData.slice(0, -1);

  const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
  const calculatedHash = hmac.update(signData).digest("hex");

  const isVerified = secureHash === calculatedHash;
  return {
    isVerified,
    message: isVerified ? "Chữ ký hợp lệ" : "Chữ ký không hợp lệ",
  };
}

// Export
module.exports = {
  vnpayConfig,
  createPaymentUrl,
  verifyReturnUrl,
  sortObject,
};
