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

  const isAdminPage = location.pathname.includes("/admin/");

  const navbarClasses = isAdminPage
    ? "navbar navbar-expand-lg navbar-dark bg-dark"
    : "navbar navbar-expand-lg navbar-dark bg-primary";

  navbar.className = navbarClasses;

  // Định nghĩa các liên kết User
  const userLinks = [
    { href: "/user/cart.html", text: "Giỏ hàng", icon: "fas fa-shopping-cart" },
    { href: "/user/wishlist.html", text: "Yêu thích", icon: "fas fa-heart" },
    { href: "/user/orders.html", text: "Đơn hàng", icon: "fas fa-receipt" },
    {
      href: "/user/notifications.html",
      text: "Thông báo",
      icon: "fas fa-bell",
    },
    {
      href: "/user/store-locator.html",
      text: "Cửa hàng",
      icon: "fas fa-store",
    },
    { href: "/user/profile.html", text: "Profile", icon: "fas fa-user-circle" },
  ];

  // Định nghĩa các liên kết Admin
  const adminLinks = [
    {
      href: "/admin/dashboard.html",
      text: "Dashboard",
      icon: "fas fa-tachometer-alt",
    },
    { href: "/admin/products.html", text: "Sản phẩm", icon: "fas fa-box" },
    // 🎯 ĐÃ THAY THẾ ROLES BẰNG CATEGORIES
    {
      href: "/admin/categories.html",
      text: "Danh mục",
      icon: "fas fa-list-alt",
    },
    { href: "/admin/orders.html", text: "Đơn hàng", icon: "fas fa-receipt" },
    { href: "/admin/users.html", text: "Người dùng", icon: "fas fa-users" },
    { href: "/admin/coupons.html", text: "Mã giảm giá", icon: "fas fa-gift" },
    { href: "/admin/inventory.html", text: "Kho", icon: "fas fa-warehouse" },

    {
      href: "/admin/notifications.html",
      text: "Thông báo",
      icon: "fas fa-bell",
    },
    // ❌ ĐÃ BỎ TRANG ROLES
    {
      href: "/admin/payments.html",
      text: "Giao dịch",
      icon: "fas fa-credit-card",
    },
  ];

  const userNavItems = userLinks
    .map(
      (link) =>
        `<li class="nav-item">
        <a class="nav-link text-white" href="${link.href}"><i class="${link.icon} me-2"></i>${link.text}</a>
    </li>`
    )
    .join("");

  const adminNavItems = adminLinks
    .map(
      (link) =>
        `<li class="nav-item">
        <a class="nav-link text-white" href="${link.href}"><i class="${link.icon} me-2"></i>${link.text}</a>
    </li>`
    )
    .join("");

  navbar.innerHTML = `
    <div class="container-fluid">
      <a class="navbar-brand text-white fw-bold" href="${
        isAdminPage ? "/admin/dashboard.html" : "/index.html"
      }">PhoneShop</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          
          ${
            !isAdminPage || !isAdmin
              ? `<li class="nav-item"><a class="nav-link text-white" href="/index.html"><i class="fas fa-home me-2"></i>Trang chủ</a></li>`
              : ""
          }
          
          ${!isAdminPage && isUser ? userNavItems : ""}
          
          ${isAdminPage && isAdmin ? adminNavItems : ""}
        </ul>
        <ul class="navbar-nav ms-auto align-items-center">
          ${
            isUser
              ? `
            <li class="nav-item"><span class="nav-link text-white"><i class="fas fa-user me-2"></i>Xin chào, ${getUserName()}</span></li>
            <li class="nav-item"><a class="nav-link text-danger fw-bold" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Đăng xuất</a></li>
          `
              : `
            <li class="nav-item"><a class="nav-link text-white" href="/login.html"><i class="fas fa-sign-in-alt me-2"></i>Đăng nhập</a></li>
            <li class="nav-item"><a class="nav-link text-white" href="/register.html"><i class="fas fa-user-plus me-2"></i>Đăng ký</a></li>
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
