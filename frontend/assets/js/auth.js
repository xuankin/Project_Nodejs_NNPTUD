// assets/js/auth.js
function setAuth(token, userData) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userData));
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

async function login(username, password) {
  const res = await POST("/auth/login", { username, password });
  setAuth(res.token, res.user);
  return res;
}

function updateNavbar() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;

  const isAdmin = getRole() === "ADMIN";
  const isUser = isLoggedIn();

  navbar.innerHTML = `
    <div class="container-fluid">
      <a class="navbar-brand text-white fw-bold" href="/index.html">PhoneShop</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item"><a class="nav-link text-white" href="/index.html">Trang chủ</a></li>
          ${
            isUser
              ? `
            <li class="nav-item"><a class="nav-link text-white" href="/user/cart.html">Giỏ hàng</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/wishlist.html">Yêu thích</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/orders.html">Đơn hàng</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/user/notifications.html">Thông báo</a></li>
          `
              : ""
          }
          ${
            isAdmin
              ? `
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle text-white" href="#" data-bs-toggle="dropdown">Quản trị</a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="/admin/products.html">Sản phẩm</a></li>
                <li><a class="dropdown-item" href="/admin/categories.html">Danh mục</a></li>
                <li><a class="dropdown-item" href="/admin/users.html">Người dùng</a></li>
                <li><a class="dropdown-item" href="/admin/orders.html">Đơn hàng</a></li>
                <li><a class="dropdown-item" href="/admin/coupons.html">Mã giảm giá</a></li>
                <li><a class="dropdown-item" href="/admin/inventory.html">Kho</a></li>
                <li><a class="dropdown-item" href="/admin/notifications.html">Thông báo</a></li>
              </ul>
            </li>
          `
              : ""
          }
        </ul>
        <ul class="navbar-nav ms-auto align-items-center">
          ${
            isUser
              ? `
            <li class="nav-item"><span class="nav-link text-white">Xin chào, ${getUserName()}</span></li>
            <li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()">Đăng xuất</a></li>
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

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();
  const userPages = ["/user/"];
  const isUserPage = userPages.some((p) => location.pathname.startsWith(p));
  if (isUserPage && !isLoggedIn()) {
    alert("Vui lòng đăng nhập!");
    window.location.href = "/login.html";
  }
  if (location.pathname.includes("/admin/") && getRole() !== "ADMIN") {
    alert("Không có quyền truy cập!");
    window.location.href = "/";
  }
});
