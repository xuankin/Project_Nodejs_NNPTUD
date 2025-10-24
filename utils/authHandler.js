let { Response } = require("../utils/responseHandler");
let jwt = require("jsonwebtoken");
let users = require("../schemas/users");

module.exports = {
  Authentication: async function (req, res, next) {
    try {
      let token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
      if (!token) return Response(res, 401, false, "Token not found");

      let decoded = jwt.verify(token, "NNPTUD");
      req.userId = decoded._id;
      next();
    } catch (err) {
      Response(res, 403, false, "Token invalid or expired");
    }
  },

  Authorization: function (...rolesRequired) {
    return async function (req, res, next) {
      try {
        let user = await users.findById(req.userId).populate("role");
        if (!user) return Response(res, 404, false, "User not found");

        let userRole = user.role?.name;
        if (rolesRequired.includes(userRole)) next();
        else Response(res, 403, false, "Không đủ quyền truy cập");
      } catch (err) {
        Response(res, 500, false, err.message);
      }
    };
  },
};
