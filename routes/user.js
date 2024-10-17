const express = require("express");
const userCtrl = require("../controller/user");
const VerifyToken = require("../middleware/VerifyToken");
const router = express.Router();


router.post("/login-admin", userCtrl.loginAdmin);
router.get("/dashboard-data", VerifyToken, userCtrl.deshboardData);
router.get("/user-data", VerifyToken, userCtrl.userData);
router.get("/sign-up-user-data", VerifyToken, userCtrl.signUpUserData);

module.exports = router;
