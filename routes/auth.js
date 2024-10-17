const express = require("express");
const authCtrl = require("../controller/auth/auth");
const userCtrl = require("../controller/user");
const VerifyToken = require("../middleware/VerifyToken");
const router = express.Router();


router.post("/check-user", authCtrl.checkUser);
router.post("/sign-up-user", authCtrl.signupUser);
router.post("/register-user", authCtrl.registerUser);
router.get("/sign-up-user-data", VerifyToken, userCtrl.signUpUserData);
router.post("/jwtTokenVerify", authCtrl.jwtTokenVerify);
router.post("/get-user-referral-code", authCtrl.getUserByReferralcode);
module.exports = router;
