// === LƯU & ĐỌC TOKEN + USER ===
function setAuth(token, userData) {
  localStorage.setItem("token", token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      role: userData.role,
      fullName: userData.fullName,
      _id: userData._id,
    })
  );
  updateNavbar();
}

function logout() {
  if (confirm("Bạn có chắc muốn đăng xuất?")) {
    localStorage.clear();
    window.location.href = "/login.html";
  }
}

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function getRole() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role || null;
}

function getUserName() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.fullName || "Người dùng";
}

// === CẬP NHẬT NAVBAR HOÀN CHỈNH ===
function updateNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const role = getRole();
  const isAdmin = role === "ADMIN";

  navbar.innerHTML = `
    <div class="container-fluid">
      <a class="navbar-brand fw-bold text-white" href="/">PhoneShop</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><a class="nav-link text-white" href="/">Trang chủ</a></li>
          ${
            isLoggedIn()
              ? `
            <li class="nav-item"><a class="nav-link text-white" href="/user/cart.html">Giỏ hàng</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/wishlist.html">Yêu thích</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/orders.html">Đơn hàng</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/profile.html">Hồ sơ</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/reviews.html">Đánh giá</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/notifications.html">Thông báo</a></li>
            ${
              isAdmin
                ? `
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle text-warning fw-bold" href="#" role="button" data-bs-toggle="dropdown">
                  Quản trị
                </a>
                <ul class="dropdown-menu">
                  <li><a class="dropdown-item" href="/admin/dashboard.html">Dashboard</a></li>
                  <li><a class="dropdown-item" href="/admin/products.html">Sản phẩm</a></li>
                  <li><a class="dropdown-item" href="/admin/categories.html">Danh mục</a></li>
                  <li><a class="dropdown-item" href="/admin/users.html">Người dùng</a></li>
                  <li><a class="dropdown-item" href="/admin/orders.html">Đơn hàng</a></li>
                  <li><a class="dropdown-item" href="/admin/coupons.html">Mã giảm giá</a></li>
                  <li><a class="dropdown-item" href="/admin/inventory.html">Kho hàng</a></li>
                  <li><a class="dropdown-item" href="/admin/roles.html">Quyền</a></li>
                  <li><a class="dropdown-item" href="/admin/notifications.html">Thông báo</a></li>
                </ul>
              </li>
            `
                : ""
            }
          `
              : ""
          }
        </ul>
        <ul class="navbar-nav ms-auto align-items-center">
          ${
            isLoggedIn()
              ? `
            <li class="nav-item">
              <span class="nav-link text-white me-3">
                <i class="bi bi-person-circle"></i> ${getUserName()}
              </span>
            </li>
            <li class="nav-item">
              <a class="nav-link text-danger fw-bold" href="#" onclick="logout()">
                <i class="bi bi-box-arrow-right"></i> Đăng xuất
              </a>
            </li>
          `
              : `
            <li class="nav-item"><a class="nav-link text-white" href="/login.html">Đăng nhập</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/register.html">Đăng ký</a></li>
          `
          }
        </ul>
      </div>
    </div>
  `;
}

// === TỰ ĐỘNG CHẠY KHI LOAD TRANG ===
document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();

  // BẢO VỆ TRANG ADMIN
  if (window.location.pathname.includes("/admin/") && getRole() !== "ADMIN") {
    alert("Bạn không có quyền truy cập trang quản trị!");
    window.location.href = "/";
  }

  // BẢO VỆ TRANG USER
  const userPages = [
    "/user/cart.html",
    "/user/orders.html",
    "/user/wishlist.html",
    "/user/profile.html",
  ];
  if (userPages.includes(window.location.pathname) && !isLoggedIn()) {
    alert("Vui lòng đăng nhập để tiếp tục!");
    window.location.href = "/login.html";
  }
});
