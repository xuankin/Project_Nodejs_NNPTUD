let jwt = require("jsonwebtoken");
let users = require("../schemas/user");
let { Response } = require("./responseHandler");

// Middleware xác thực người dùng (check token)
async function Authentication(req, res, next) {
  try {
    let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) return Response(res, 401, false, "Token không tồn tại");

    let decoded = jwt.verify(token, "NNPTUD"); // khóa bí mật của bạn
    req.userId = decoded._id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    Response(res, 403, false, "Token không hợp lệ hoặc đã hết hạn");
  }
}

// Middleware phân quyền
function Authorization(...rolesRequired) {
  return async function (req, res, next) {
    try {
      let user = await users.findById(req.userId).populate("role");
      if (!user) return Response(res, 404, false, "Người dùng không tồn tại");

      let userRole = user.role?.name;
      if (rolesRequired.includes(userRole)) {
        next();
      } else {
        Response(
          res,
          403,
          false,
          "Bạn không đủ quyền để thực hiện hành động này"
        );
      }
    } catch (err) {
      Response(res, 500, false, err.message);
    }
  };
}

module.exports = { Authentication, Authorization };
