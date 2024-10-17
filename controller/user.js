const db = require("../config/db");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const configFile = require("../config/jwt_config");
function executeQuery(query, params = "") {
  let param = JSON.parse(params);

  return new Promise((resolve, reject) => {
    db.query(query, param, (err, result) => {
      if (err) {
        console.log(err, "err");
        // reject(err);
      } else {
        resolve(result);
      }
    });
  });
}



exports.loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.send({
      status: false,
      message: "Email is required!",
      data: {},
    });
  }

  if (!password) {
    return res.send({
      status: false,
      message: "Password is required!",
      data: {},
    });
  }

  const query = "SELECT * FROM users WHERE email = ? AND user_type = ?";
  const params = [email, "Admin"];

  try {
    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const user = checkQueryResult[0];

    if (!user) {
      return res.send({
        status: false,
        message: "Invalid credentials",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      const token = jwt.sign(
        { loginUserId: user.id, user_type: "Admin" },
        configFile.secret,
        {}
      );
      return res.send({
        status: true,
        message: "Login successfully",
        data: checkQueryResult,
        token: token,
        user_type: "Admin",
      });
    } else {
      return res.send({
        status: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.send({
      status: false,
      message: "An error occurred",
    });
  }
};
exports.deshboardData = async (req, res) => {
  try {
    const query =
      "SELECT  COUNT (id) as totalUsers FROM users WHERE user_type = ? ";
    const params = ["User"];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const query1 = "SELECT  COUNT (id) as totalTransactions FROM transactions";
    const params1 = [];

    const checkQueryResult1 = await executeQuery(
      query1,
      JSON.stringify(params1)
    );

    if (checkQueryResult.length > 0 || checkQueryResult1.length > 0) {
      return res.send({
        status: true,
        message: "Dashboard data found successfully",
        data: checkQueryResult[0],
        data1: checkQueryResult1[0],
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.userData = async (req, res) => {
  try {
    const query =
      "SELECT id,name,email,bonus,usdt,mobile_number,country_code,	wallet_address,created_at FROM users WHERE user_type = ? ORDER BY id DESC";
    const params = ["User"];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: true,
        message: "User data found successfully",
        data: checkQueryResult,
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};
exports.signUpUserData = async (req, res) => {
  try {
    const query =
      "SELECT * FROM signup_user ORDER BY id DESC";
    const params = [];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: true,
        message: "User data found successfully",
        data: checkQueryResult,
      });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};
