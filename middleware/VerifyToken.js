var jwt = require("jsonwebtoken");
var config = require("../config/jwt_config");

function VerifyToken(req, res, next) {
  var token = req.headers["authorization"] || req.headers["x-access-token"];

  if (token) {
    token = token.replace(/^Bearer\s+/, "");
    if (!token)
      return res
        .status(403)
        .send({ status: false, message: "No token provided", data: "" });
    jwt.verify(token, config.secret, function (err, decoded) {
      if (err)
        return res.status(200).send({
          status: false,
          message: "Failed to authenticate token.",
          data: "",
        });

      
      req.loginUserId = decoded.id;
    
      req.address = decoded.address;

      next();
    });
  } else {
    return res.status(400).send({
      status: false,
      message: "Failed to authenticate token.",
      data: "",
    });
  }
}
module.exports = VerifyToken;
