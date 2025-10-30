// === CATEGORY ===
async function loadCategoriesAdmin() {
  const cats = await GET("/categories");
  document.getElementById("catTable").innerHTML = cats
    .map(
      (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.description || ""}</td>
      <td>${c.parentCategory?.name || "—"}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editCat('${
          c._id
        }')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCat('${
          c._id
        }')">Xóa</button>
      </td>
    </tr>
  `
    )
    .join("");
  const select = document.getElementById("parentCat");
  select.innerHTML =
    '<option value="">Không có cha</option>' +
    cats.map((c) => `<option value="${c._id}">${c.name}</option>`).join("");
}

function resetCatForm() {
  document.getElementById("catForm").reset();
  document.getElementById("catId").value = "";
  document.getElementById("catModalTitle").textContent = "Thêm danh mục";
}

async function editCat(id) {
  const cat = await GET(`/categories/${id}`);
  document.getElementById("catId").value = cat._id;
  document.getElementById("catName").value = cat.name;
  document.getElementById("catDesc").value = cat.description || "";
  document.getElementById("parentCat").value = cat.parentCategory?._id || "";
  document.getElementById("catModalTitle").textContent = "Sửa danh mục";
  new bootstrap.Modal(document.getElementById("catModal")).show();
}

document.getElementById("catForm").onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById("catId").value;
  const formData = new FormData();
  formData.append("name", document.getElementById("catName").value);
  formData.append("description", document.getElementById("catDesc").value);
  formData.append("parentCategory", document.getElementById("parentCat").value);
  if (document.getElementById("catImage").files[0]) {
    const img = await UPLOAD_SINGLE(
      new FormData().append(
        "file",
        document.getElementById("catImage").files[0]
      )
    );
    formData.append("imageURL", img.path);
  }
  const body = Object.fromEntries(formData.entries());
  if (id) await PUT(`/categories/${id}`, body);
  else await POST("/categories", body);
  bootstrap.Modal.getInstance(document.getElementById("catModal")).hide();
  loadCategoriesAdmin();
};

async function deleteCat(id) {
  if (confirm("Xóa danh mục?")) {
    await DEL(`/categories/${id}`);
    loadCategoriesAdmin();
  }
}

// === USER ===
async function loadUsersAdmin() {
  const users = await GET("/users");
  document.getElementById("userTable").innerHTML = users
    .map(
      (u) => `
    <tr>
      <td>${u._id}</td>
      <td>${u.fullName}</td>
      <td>${u.email}</td>
      <td>${u.role?.name || "USER"}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${
          u._id
        }')">Xóa</button>
      </td>
    </tr>
  `
    )
    .join("");
}

async function deleteUser(id) {
  if (confirm("Xóa người dùng?")) {
    await DEL(`/users/${id}`);
    loadUsersAdmin();
  }
}

// === ORDER ===
async function loadOrdersAdmin() {
  const orders = await GET("/orders");
  document.getElementById("orderTable").innerHTML = orders
    .map(
      (o) => `
    <tr>
      <td>${o._id}</td>
      <td>${o.user.fullName}</td>
      <td>${o.finalAmount.toLocaleString()}đ</td>
      <td>
        <select class="form-control form-control-sm" onchange="updateStatus('${
          o._id
        }', this.value)">
          ${["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"]
            .map(
              (s) =>
                `<option value="${s}" ${
                  o.status === s ? "selected" : ""
                }>${s}</option>`
            )
            .join("")}
        </select>
      </td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td><button class="btn btn-sm btn-info" onclick="viewOrder('${
        o._id
      }')">Xem</button></td>
    </tr>
  `
    )
    .join("");
}

async function updateStatus(id, status) {
  await PUT(`/orders/${id}/status`, { status });
  alert("Cập nhật trạng thái thành công!");
}

function viewOrder(id) {
  alert("Xem chi tiết đơn hàng: " + id);
}

// === COUPON ===
async function loadCouponsAdmin() {
  const coupons = await GET("/coupons");
  document.getElementById("couponTable").innerHTML = coupons
    .map(
      (c) => `
    <tr>
      <td>${c.code}</td>
      <td>${c.discountType}</td>
      <td>${c.discountValue}${c.discountType === "percent" ? "%" : "đ"}</td>
      <td>${c.maxDiscount || "—"}</td>
      <td>${c.minAmount}đ</td>
      <td>${new Date(c.validTo).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editCoupon('${
          c._id
        }')">Sửa</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCoupon('${
          c._id
        }')">Xóa</button>
      </td>
    </tr>
  `
    )
    .join("");
}

function resetCouponForm() {
  document.getElementById("couponForm").reset();
  document.getElementById("couponId").value = "";
  document.getElementById("couponModalTitle").textContent = "Thêm mã";
}

async function editCoupon(id) {
  const c = await GET(`/coupons/${id}`);
  document.getElementById("couponId").value = c._id;
  document.getElementById("code").value = c.code;
  document.getElementById("type").value = c.discountType;
  document.getElementById("value").value = c.discountValue;
  document.getElementById("maxDiscount").value = c.maxDiscount || "";
  document.getElementById("minAmount").value = c.minAmount;
  document.getElementById("validTo").value = new Date(c.validTo)
    .toISOString()
    .split("T")[0];
  document.getElementById("couponModalTitle").textContent = "Sửa mã";
  new bootstrap.Modal(document.getElementById("couponModal")).show();
}

document.getElementById("couponForm").onsubmit = async (e) => {
  e.preventDefault();
  const id = document.getElementById("couponId").value;
  const body = {
    code: document.getElementById("code").value.toUpperCase(),
    discountType: document.getElementById("type").value,
    discountValue: parseFloat(document.getElementById("value").value),
    maxDiscount:
      parseFloat(document.getElementById("maxDiscount").value) || null,
    minAmount: parseFloat(document.getElementById("minAmount").value),
    validTo: document.getElementById("validTo").value,
  };
  if (id) await PUT(`/coupons/${id}`, body);
  else await POST("/coupons", body);
  bootstrap.Modal.getInstance(document.getElementById("couponModal")).hide();
  loadCouponsAdmin();
};

async function deleteCoupon(id) {
  if (confirm("Xóa mã giảm giá?")) {
    await DEL(`/coupons/${id}`);
    loadCouponsAdmin();
  }
}
