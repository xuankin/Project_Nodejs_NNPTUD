var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let mongoose = require("mongoose");
let { Response } = require("./utils/responseHandler");

// =======================
// 🔗 DATABASE CONNECTION
// =======================
mongoose
  .connect("mongodb://localhost:27017/Project")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

var app = express();

// =======================
// 🔧 MIDDLEWARE SETUP
// =======================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// public folder for static and uploads
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// =======================
// 🧭 ROUTES
// =======================
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.use("/roles", require("./routes/roles"));
app.use("/auth", require("./routes/auth"));
app.use("/upload", require("./routes/upload"));

// ===> Các route mới được thêm vào:
app.use("/products", require("./routes/productRoutes"));
app.use("/categories", require("./routes/categoryRoutes"));
app.use("/orders", require("./routes/orderRoutes"));
app.use("/carts", require("./routes/cartRoutes"));
app.use("/wishlists", require("./routes/wishlistRoutes"));
app.use("/coupons", require("./routes/couponRoutes"));
app.use("/inventories", require("./routes/inventoryRoutes"));
app.use("/payments", require("./routes/paymentRoutes"));
app.use("/reviews", require("./routes/reviewRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

// =======================
// ⚠️ ERROR HANDLERS
// =======================

// 404 Not Found
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  Response(
    res,
    err.status || 500,
    false,
    err.message || "Internal Server Error"
  );
});

module.exports = app;
