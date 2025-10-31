// assets/js/api.js
const API_URL = "http://localhost:3000"; // ĐÚNG URL backend

async function request(method, url, body = null) {
  const token = localStorage.getItem("token");

  // 🎯 PHẦN SỬA LỖI QUAN TRỌNG NHẤT: Xử lý FormData
  const isFormData = body instanceof FormData;

  const headers = {
    // Chỉ thêm Content-Type: application/json nếu body KHÔNG phải là FormData
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const res = await fetch(API_URL + url, {
      method,
      headers,
      // 🎯 SỬA LỖI: Chỉ stringify nếu body không phải là FormData
      body: isFormData ? body : body ? JSON.stringify(body) : null,
    });

    // 🎯 CHỈNH SỬA LỚN: Xử lý lỗi 401/403 trước khi đọc JSON/HTML
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      alert("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      throw new Error("Unauthorized or Token Expired");
    }

    // KIỂM TRA NẾU SERVER TRẢ HTML (do 404, redirect...)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        throw new Error("Lỗi: Không tìm thấy API Endpoint.");
      }
      throw new Error("Server trả về dữ liệu không hợp lệ");
    }

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message || "Lỗi không xác định");
    }

    return data.data; // TRẢ VỀ CHỈ data (cart, order, ...)
  } catch (err) {
    if (err.message === "Unauthorized or Token Expired") {
      window.location.href = "/login.html";
    }
    console.error("API Error:", err);
    throw err;
  }
}

// Helper
async function GET(url) {
  return await request("GET", url);
}
async function POST(url, body) {
  return await request("POST", url, body);
}
async function PUT(url, body) {
  return await request("PUT", url, body);
}
async function DEL(url) {
  return await request("DELETE", url);
}
