// === API HELPER ===
const API_URL = "";

async function request(method, url, body = null) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const res = await fetch(API_URL + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Lỗi server");
  return data.data || data;
}

// === PHƯƠNG THỨC GỌI NHANH ===
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

// === UPLOAD SINGLE FILE ===
async function UPLOAD_SINGLE(formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(API_URL + "/upload/single", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data;
}
