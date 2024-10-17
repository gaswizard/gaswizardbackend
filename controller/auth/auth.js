const db = require("../../config/db");
const { types } = require("../../config/enum");
const { Emailpattern } = require("../../pattern/pattern");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const configFile = require("../../config/jwt_config");
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

exports.checkUser = async (req, res) => {
  try {
    const { address } = req.body;

    const checkEmailQuery = "SELECT * FROM users WHERE wallet_address=?";
    [user] = await executeQuery(checkEmailQuery, JSON.stringify([address]));

    if (user) {
      return res.send({
        status: true,
      });
    } else {
      return res.send({
        status: false,
        message: "User not registered",
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

exports.signupUser = async (req, res) => {
  try {
    const { email, mobile_number, name, address, country_code } = req.body;
    if (!address) {
      return res.send({
        status: false,
        message: "Please connect with metamask",
      });
    }
    if (!email && !name && !mobile_number) {
      return res.send({
        status: false,
        message: "Please provide name, email, mobile_number",
      });
    }

    const checkQuery = "SELECT * FROM users WHERE wallet_address=? ";
    const checkQueryResult = await executeQuery(
      checkQuery,
      JSON.stringify([address])
    );

    if (checkQueryResult.length > 0) {
      return res.send({
        status: false,
        message: "User already registered",
      });
    }
    const checkQuery1 = "SELECT * FROM users WHERE 	email=? ";
    const checkQueryResult1 = await executeQuery(
      checkQuery1,
      JSON.stringify([email])
    );
    if (checkQueryResult1.length > 0) {
      return res.send({
        status: false,
        message: "Email is  already registered",
      });
    }
    const checkQuery2 = "SELECT * FROM users WHERE 	mobile_number=? ";
    const checkQueryResult2 = await executeQuery(
      checkQuery2,
      JSON.stringify([mobile_number])
    );
    if (checkQueryResult2.length > 0) {
      return res.send({
        status: false,
        message: "Mobile number is  already registered",
      });
    }
    const insertQuery =
      "INSERT INTO users (name,wallet_address,email, mobile_number,country_code,status,user_type) VALUES (?,?, ?,?,?,?,?)";
    const insertParams = [
      name,
      address,
      email,
      mobile_number,
      country_code,
      "Active",
      "User",
    ];
    const result = await executeQuery(
      insertQuery,
      JSON.stringify(insertParams)
    );
    if (result) {
      const token = jwt.sign({ id: result.insertId }, configFile.secret, {
        // expiresIn: 86400,
      });
      return res.send({
        status: true,
        token: token,
        message: "Register success",
      });
    }
  } catch (error) {
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};
exports.registerUser = async (req, res) => {
  try {
    const { email, mobile_number, name,country_code } = req.body;

    if (!email && !name && !mobile_number) {
      return res.send({
        status: false,
        message: "Please provide name, email, mobile_number",
      });
    }

    const checkQuery1 = "SELECT * FROM signup_user WHERE 	email=? ";
    const checkQueryResult1 = await executeQuery(
      checkQuery1,
      JSON.stringify([email])
    );
    if (checkQueryResult1.length > 0) {
      return res.send({
        status: false,
        message: "Email is  already registered",
      });
    }
    const checkQuery2 = "SELECT * FROM signup_user WHERE 	mobile_number=? ";
    const checkQueryResult2 = await executeQuery(
      checkQuery2,
      JSON.stringify([mobile_number])
    );
    if (checkQueryResult2.length > 0) {
      return res.send({
        status: false,
        message: "Mobile number is  already registered",
      });
    }
    const insertQuery =
      "INSERT INTO signup_user (name,email,country_code, mobile_number) VALUES (?,?,?,?)";
    const insertParams = [name, email,country_code, mobile_number];
    const result = await executeQuery(
      insertQuery,
      JSON.stringify(insertParams)
    );
    if (result) {
      // const token = jwt.sign({ id: result.insertId }, configFile.secret, {
      //   // expiresIn: 86400,
      // });
      return res.send({
        status: true,
        // token: token,
        message: "Sign-up  success",
      });
    }
  } catch (error) {
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};
exports.getUserByReferralcode=async(req,res)=>{
  try {
    const {referral_code}=req.body
    const getQyery="SELECT * FROM users WHERE referral_code=?"
    const getData = await executeQuery(
      getQyery,
      JSON.stringify([referral_code])
    );
    if(getData.length>0){
      return res.send({status:true,message:"Record found successfully"})
    }
    else{
      return res.send({status:false,message:"No record found"})
    }
  } catch (error) {
    return res.send({status:false,message:error})
  }
}

exports.jwtTokenVerify = async (req, res) => {
  if (req.body.address) {
    const token = jwt.sign(
      { address: req.body.address },
      configFile.secret,
      {}
    );
    return res.send({
      token: token,
    });
  }
};
