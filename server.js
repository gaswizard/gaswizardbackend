const express = require("express");
const app = express();
let db = require("./config/db");
const cors = require("cors");
var Web3 = require("web3");
const crypto = require("crypto");

const fs = require("fs");
const bodyParser = require("body-parser");
const okk = require("./cron")
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(crons())
app.use("/static", express.static("public"));
// const func = async()=>{
//   const resp = await handleDepositAtEvent()
//   return resp
// }

// console.log(func(),"crons")

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});


app.use("/api/v1", require("./routes/user"));

app.use("/api/v1", require("./routes/auth"));
app.use("/api/v1", require("./routes/transaction"));






let port = 8084;
const server = app.listen(port, () => {
  console.log(`Server up and running on port ${port} !`);
});
