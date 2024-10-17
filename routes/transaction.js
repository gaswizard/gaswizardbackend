const express = require("express");
const trxCtrl = require("../controller/transaction");
const VerifyToken = require("../middleware/VerifyToken");
const router = express.Router();

router.post("/transaction", VerifyToken, trxCtrl.trnsactionAdd);
router.post("/transaction-get", trxCtrl.getTransaction);
router.post("/trx-apply",VerifyToken, trxCtrl.metaRequestInsert);
router.get("/get-total-usdt", trxCtrl.getTransactionTotal);
router.get("/get-transaction",VerifyToken, trxCtrl.TransactionData);
router.post("/bonus-add-update",VerifyToken, trxCtrl.bonusAddUpdate);
router.get("/get-referral",VerifyToken, trxCtrl.referralData);
router.post("/generate-referral-code", trxCtrl.generateReferalCode);
router.post("/manual-entry-add", trxCtrl.manualEntryInsert);
router.get("/get-manual-entry",VerifyToken, trxCtrl.manualEntryData);
router.post("/manual-cron-hit",VerifyToken, trxCtrl.manualCron);

module.exports = router;
