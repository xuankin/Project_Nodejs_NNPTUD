// assets/js/api.js
const API_URL = "http://localhost:3000"; // ĐÚNG URL backend

async function request(method, url, body = null) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const res = await fetch(API_URL + url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    // 🎯 CHỈNH SỬA LỚN: Xử lý lỗi 401/403 trước khi đọc JSON/HTML
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      alert("Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.");
      // Throw lỗi để ngăn hàm tiếp tục chạy và chuyển hướng
      throw new Error("Unauthorized or Token Expired");
    }

    // KIỂM TRA NẾU SERVER TRẢ HTML (do 404, redirect...)
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      // Nếu là HTML, thường là lỗi 404 của SPA hoặc route không tồn tại
      if (text.includes("<!DOCTYPE") || text.includes("<html")) {
        // Không cần redirect/clear localStorage vì 401/403 đã xử lý ở trên
        throw new Error("Lỗi: Không tìm thấy API Endpoint.");
      }
      throw new Error("Server trả về dữ liệu không hợp lệ");
    }

    const data = await res.json();

    // ĐỒNG BỘ VỚI Response wrapper: { success, data, message }
    if (!data.success) {
      throw new Error(data.message || "Lỗi không xác định");
    }

    return data.data; // TRẢ VỀ CHỈ data (cart, order, ...)
  } catch (err) {
    // Nếu là lỗi "Unauthorized...", sẽ có redirect
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
