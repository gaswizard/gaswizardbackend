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

exports.register = async (req, res) => {
  const { email, mobile_number } = req.body;
  if (email) {
    const params = [email];
    const checkQuery = "SELECT id FROM users WHERE email=?";
    const checkQueryResult = await executeQuery(
      checkQuery,
      JSON.stringify(params)
    );
    if (checkQueryResult.length > 0) {
      return res.send({
        status: false,
        message: "User already registered",
      });
    } else {
    }
  }

  if (type === types.Metamask) {
    console.log("meta");
    if (!wallet_addr) {
      return res.send({
        status: false,
        message: "Wallet address is required!",
      });
    }
    const params = [wallet_addr];
    const checkQuery = "SELECT id FROM users WHERE email=? OR mobile_number=?";
    const checkQueryResult = await executeQuery(
      checkQuery,
      JSON.stringify(params)
    );

    if (checkQueryResult.length > 0) {
      const token = jwt.sign(
        { id: checkQueryResult[0]["id"] },
        configFile.secret,
        {}
      );
      res.send({
        status: true,
        message: "Login successfully",
        token,
      });
      return;
    } else {
      const query1 =
        "INSERT INTO users (register_type,	wallet_addr) VALUES (?, ?)";
      const params1 = [type, wallet_addr];

      const findData = await executeQuery(query1, JSON.stringify(params1));

      if (findData) {
        const token = jwt.sign({ id: findData.insertId }, configFile.secret, {
          // expiresIn: 86400,
        });

        return res.send({
          status: true,
          message: "Register successfully",
          token,
        });
      }
    }
  } else {
    if (!fName) {
      res.send({
        status: false,
        message: "Name is required!",
        data: {},
      });
      return;
    }

    if (!email) {
      res.send({
        status: false,
        message: "Email is required!",
        data: {},
      });
      return;
    }
    if (!Emailpattern.test(email)) {
      return res.send({
        status: false,
        message: "Please enter  valid email",
        data: {},
      });
    }
    if (!mobile) {
      res.send({
        status: false,
        message: "Mobile number is required!",
        data: {},
      });
      return;
    }
    if (!password) {
      res.send({
        status: false,
        message: "Password is required!",
        data: {},
      });
      return;
    }
    if (!cPassword) {
      return res.send({
        status: false,
        message: " Confirm password is required!",
        data: {},
      });
    }
    if (password != cPassword) {
      return res.send({
        status: false,
        message: "Confirm password miss-matched",
        data: {},
      });
    }

    const query = "SELECT * FROM users WHERE email=?";
    const params = [email];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: false,
        message: "Email is already registered",
        data: {},
      });
    }
    try {
      const salt = await bcrypt.genSaltSync(10);

      const hashedPassword = await bcrypt.hashSync(password, salt);
      const query1 =
        "INSERT INTO users (fname,email,mobile,password,registerId) VALUES (?, ?, ?,?,?)";
      const params1 = [fName, email, mobile, hashedPassword, registerId];

      const findData = await executeQuery(query1, JSON.stringify(params1));

      if (findData) {
        return res.send({
          status: true,
          message: "Congrats, you have been registered successfully",
        });
      }
    } catch (error) {
      console.error("Error hashing password:", error);
      return res.send({
        status: false,
        message: "Error registering user",
        data: {},
      });
    }
  }
};

exports.changePasssword = async (req, res) => {
  const { NewPassword, CPassword, OldPassword } = req.body;
  if (!OldPassword) {
    res.send({
      status: false,
      message: "Current password is required",
    });
    return false;
  }

  if (!NewPassword) {
    res.send({
      status: false,
      message: "New password is required",
    });
    return false;
  }
  if (!CPassword) {
    res.send({
      status: false,
      message: "Confirm password is required",
    });
    return false;
  }

  if (NewPassword != CPassword) {
    res.send({
      status: false,
      message: "Confirm password miss-matched",
    });
    return false;
  }

  const Passwordpattern =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#%?^-_/$&*]).{8,}$/;
  if (NewPassword.match(Passwordpattern)) {
    res.send({
      status: false,
      message:
        "Password must be at least 8 characters long, contains a letter, a number, and a symbol",
    });
    return;
  }

  if (OldPassword == NewPassword) {
    res.send({
      status: false,
      message: "Please enter the different password",
    });
    return false;
  }

  const query1 = "SELECT * FROM users WHERE id =?";
  const params1 = [req.loginUserId];

  const checkQueryResult = await executeQuery(query1, JSON.stringify(params1));
  const user = checkQueryResult[0];

  const isOldPasswordCorrect = await bcrypt.compare(OldPassword, user.password);

  if (isOldPasswordCorrect) {
    const salt = await bcrypt.genSaltSync(10);

    const hashedPassword = await bcrypt.hashSync(NewPassword, salt);

    const query = "UPDATE users SET password = ? WHERE id = ?";
    const params = [hashedPassword, req.loginUserId];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult) {
      return res.send({
        status: true,
        message: "New password updated successfully",
        checkQueryResult,
      });
    }
  } else {
    return res.send({ status: false, message: "Old password is not matched" });
  }
};

exports.getCode = async (req, res) => {
  try {
    const randNum = Math.floor(100000 + Math.random() * 900000).toString();
    const { email, mobile_number, name, type } = req.body;

    if (type === "email") {
      const emailParams = [email, "Active"];
      const checkEmailQuery =
        "SELECT id,mobile_number FROM users WHERE email=? AND status=?";
      const [userWithEmail] = await executeQuery(
        checkEmailQuery,
        JSON.stringify(emailParams)
      );
      if (userWithEmail) {
        return res.send({
          status: false,
          message: "User already exist",
        });
      }

      if (!userWithEmail) {
        const emailParams1 = [email, "Inactive"];
        const checkEmailQuery =
          "SELECT id,mobile_number FROM users WHERE email=? AND status=?";
        const [userWithEmails] = await executeQuery(
          checkEmailQuery,
          JSON.stringify(emailParams1)
        );
        if (userWithEmails) {
          const updateQuery = "UPDATE users SET  otp = ? WHERE email = ?";
          const updateParams = [randNum, email];
          const resp = await executeQuery(
            updateQuery,
            JSON.stringify(updateParams)
          );
          if (resp) {
            return res.send({
              status: true,
              message: "Otp resend success",
              otp: randNum,
            });
          }
        } else {
          const insertQuery =
            "INSERT INTO users (name,email, otp) VALUES (?, ?,?)";
          const insertParams = [name, email, randNum];
          const result = await executeQuery(
            insertQuery,
            JSON.stringify(insertParams)
          );
          if (result) {
            return res.send({
              status: true,
              message: "OTP sent successfully",
              otp: randNum,
            });
          }
        }
      }
    } else {
      const updateQuery1 =
        "SELECT id,mobile_number FROM users WHERE mobile_number=? AND status=?";
      const updateParams1 = [mobile_number, "Active"];
      const resp1 = await executeQuery(
        updateQuery1,
        JSON.stringify(updateParams1)
      );
     console.log(resp1,"resp1");
      if (resp1.length>0) {
        return res.send({
          status: false,
          message: "Mobile number already registered",
        });
      }

      const updateQuery =
        "UPDATE users SET mobile_number=?, otp = ? WHERE email = ?";
      const updateParams = [mobile_number, randNum, email];
      const resp = await executeQuery(
        updateQuery,
        JSON.stringify(updateParams)
      );
      if (resp) {
        return res.send({
          status: true,
          message: "OTP sent successfully",
          otp: randNum,
        });
      }
    }

    if (!userWithEmail) {
      const insertQuery = "INSERT INTO users (name,email, otp) VALUES (?, ?,?)";
      const insertParams = [name, email, randNum];
      const result = await executeQuery(
        insertQuery,
        JSON.stringify(insertParams)
      );
      if (result) {
        return res.send({
          status: true,
          message: "OTP sent successfully",
          otp: randNum,
        });
      }
    } else {
      let resp;
    }
  } catch (error) {
    console.error("Error in getCode:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.checkOTP = async (req, res) => {
  try {
    const { email, mobile_number, otp, type } = req.body;

    if (!email && !mobile_number) {
      return res.send({
        status: false,
        message: "Please provide either email or mobile_number",
      });
    }

    let user;
    if (type === "email") {
      const checkEmailQuery = "SELECT * FROM users WHERE email=? AND otp=?";
      [user] = await executeQuery(
        checkEmailQuery,
        JSON.stringify([email, otp])
      );
      if (user) {
        if (email) {
          return res.send({
            status: true,
            message: "Email verified successfully",
          });
        } else if (mobile_number) {
          return res.send({
            status: true,

            message: "Email verify success",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Invalid OTP",
        });
      }
    } else {
      const checkEmailQuery = "SELECT * FROM users WHERE email=? AND otp=?";
      [user] = await executeQuery(
        checkEmailQuery,
        JSON.stringify([email, otp])
      );
      if (user) {
        const updateQuery = "UPDATE users SET status=? WHERE email = ?";
        const updateParams = ["Active", email];
        await executeQuery(updateQuery, JSON.stringify(updateParams));
        if (mobile_number) {
          const token = jwt.sign({ id: user.id }, configFile.secret, {
            // expiresIn: 86400,
          });
          return res.send({
            status: true,
            token: token,
            message: "Registration success",
          });
        }
      } else {
        return res.send({
          status: false,
          message: "Invalid OTP",
        });
      }
    }
  } catch (error) {
    console.error("Error in checkOTP:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getCodeForLogin = async (req, res) => {
  try {
    const randNum = Math.floor(100000 + Math.random() * 900000).toString();
    const { email, mobile_number, name, type } = req.body;

    if (!email && !mobile_number) {
      return res.send({
        status: false,
        message: "Please enter  email or mobile number",
      });
    }
    const emailParams = [email, mobile_number, "Active"];
    const checkEmailQuery =
      "SELECT id,mobile_number FROM users WHERE email=? OR mobile_number=? AND status=?";
    const [userWithEmail] = await executeQuery(
      checkEmailQuery,
      JSON.stringify(emailParams)
    );

    if (!userWithEmail) {
      return res.send({
        status: false,
        message: "User not registered",
      });
    }
    if (!userWithEmail.mobile_number) {
      return res.send({
        status: false,
        message: "User not registered",
      });
    }

    if (type === "email") {
      const updateQuery = "UPDATE users SET otp = ? WHERE email = ?";
      const updateParams = [randNum, email];
      const resp = await executeQuery(
        updateQuery,
        JSON.stringify(updateParams)
      );
      if (resp) {
        return res.send({
          status: true,
          otp: randNum,
          message: "Otp send success",
        });
      }
    } else {
      const updateQuery = "UPDATE users SET otp = ? WHERE mobile_number = ?";
      const updateParams = [randNum, mobile_number];
      const resp = await executeQuery(
        updateQuery,
        JSON.stringify(updateParams)
      );
      if (resp) {
        return res.send({
          status: true,
          message: "OTP sent successfully",
          otp: randNum,
        });
      }
    }
  } catch (error) {
    console.error("Error in getCode:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { type, email, mobile_number, otp } = req.body;

    if (type === "email") {
      const checkEmailQuery = "SELECT * FROM users WHERE email=? AND otp=?";
      [user] = await executeQuery(
        checkEmailQuery,
        JSON.stringify([email, otp])
      );
      if (user) {
        const token = jwt.sign({ id: user.id }, configFile.secret, {
          // expiresIn: 86400,
        });
        return res.send({
          status: true,
          token: token,
          message: "Login successfully",
        });
      } else {
        return res.send({
          status: false,
          message: "Invalid OTP",
        });
      }
    } else {
      const checkEmailQuery =
        "SELECT * FROM users WHERE mobile_number=? AND otp=?";
      [user] = await executeQuery(
        checkEmailQuery,
        JSON.stringify([mobile_number, otp])
      );
      if (user) {
        const token = jwt.sign({ id: user.id }, configFile.secret, {
          // expiresIn: 86400,
        });
        return res.send({
          status: true,
          token: token,
          message: "Login success",
        });
      } else {
        return res.send({
          status: false,
          message: "Invalid OTP",
        });
      }
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.send({
      status: false,
      message: "Internal server error",
    });
  }
};

const lastLogin = async (userId, ip) => {
  let query = "SELECT * FROM user WHERE id=?";
  const params = [userId];

  const result = await executeQuery(query, JSON.stringify(params));
  if (result.length > 0) {
    // let lastLogins;
    // let ips;
    // if (!result[0].last_login) {
    //   lastLogins = [new Date(), new Date()];
    //   ips = [ip, ip];
    // } else {
    //   let resultLastJson = JSON.parse(result[0].last_login);
    //   let resultIpJson = JSON.parse(result[0].ip);
    //   lastLogins = [resultLastJson[1], new Date()];
    //   ips = [resultIpJson[1], ip];
    // }
    let updateQuery =
      "INSERT INTO loginhistories (last_login_at,user_id) VALUES (?,?)";
    const params1 = [JSON.stringify(ip), userId];
    const results = await executeQuery(updateQuery, params1);
  }
};
