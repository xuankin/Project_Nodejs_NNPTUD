// assets/js/user.js
async function loadProducts(containerId = "products") {
  try {
    const products = await GET("/products");
    const container = document.getElementById(containerId);
    container.innerHTML = products
      .map(
        (p) => `
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm">
          <img src="${
            p.images?.[0] || "/assets/img/no-image.png"
          }" class="card-img-top" style="height:200px; object-fit:cover;">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.name}</h5>
            <p class="text-danger fw-bold">${p.price.toLocaleString()}đ</p>
            <a href="/user/product-detail.html?id=${
              p._id
            }" class="btn btn-primary mt-auto">Xem chi tiết</a>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (err) {
    alert("Lỗi tải sản phẩm: " + err.message);
  }
}
