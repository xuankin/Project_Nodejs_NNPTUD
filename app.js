var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let mongoose = require("mongoose");

// =======================
// DATABASE CONNECTION
// =======================
mongoose
  .connect("mongodb://localhost:27017/Project")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

var app = express();

// =======================
// MIDDLEWARE
// =======================
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files: frontend + uploads
app.use(express.static(path.join(__dirname, "frontend"))); // ĐÚNG
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// =======================
// ROUTES
// =======================
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.use("/roles", require("./routes/roles"));
app.use("/auth", require("./routes/auth"));
app.use("/upload", require("./routes/upload"));

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
// SPA: Serve index.html cho mọi route (trừ API & uploads)
// =======================
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// =======================
// ERROR HANDLERS
// =======================
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
