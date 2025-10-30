async function loadProducts(containerId = "products") {
  const products = await GET("/products");
  const container = document.getElementById(containerId);
  container.innerHTML = products
    .map(
      (p) => `
    <div class="col-md-4 mb-4">
      <div class="card h-100">
        <img src="${
          p.images?.[0] || "/assets/img/no-image.png"
        }" class="card-img-top" style="height:200px; object-fit:cover;">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.name}</h5>
          <p class="text-danger fw-bold">${p.price.toLocaleString()}đ</p>
          <button class="btn btn-primary mt-auto me-2" onclick="addToCart('${
            p._id
          }')">
            Thêm vào giỏ
          </button>
          <button class="btn btn-outline-danger mt-auto" onclick="addToWishlist('${
            p._id
          }')">
            Yêu thích
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

async function addToCart(productId) {
  if (!isLoggedIn()) return alert("Vui lòng đăng nhập!");
  await POST("/carts", { productId, quantity: 1 });
  alert("Đã thêm vào giỏ hàng!");
}

async function addToWishlist(productId) {
  if (!isLoggedIn()) return alert("Vui lòng đăng nhập!");
  await POST("/wishlists", { productId });
  alert("Đã thêm vào yêu thích!");
}
