const db = require("../config/db");
var cron = require("node-cron");
const Web3 = require("web3");
const axios = require("axios");
const { Contract, JsonRpcProvider } = require("ethers");
const {
  bscRpcUrl,
  ethRpcUrl,
  polygonRpcUrl,
  arbitrumRpcUrl,
  avalancheRpcUrl,
  gasWizardAddress,
  gasWizardabi,
  gasWizardEthAddress,
  gasWizardEthabi,
  gasWizardPolygonAddress,
  gasWizardPolygonabi,
  gasWizardAvalancheAddress,
  gasWizardAvalancheAbi,
} = require("../constent/index");
const {
  chainType,
  bnbCurrencyType,
  ethersCurrencyType,
  polygonCurrencyType,
  arbitrumCurrencyType,
  avalancheCurrencyType,
} = require("../config/enum");
cron.schedule(" */1 * * * *", () => {
  checkTrxCron();
});
cron.schedule(" */20 * * * *", () => {
  checkFailedTrx();
  console.log("ccccall");
});
cron.schedule("*/45 * * * *", () => {
  fetchTransactions();
});
cron.schedule("*/50 * * * *", () => {
  fetchTransactionsEth();
});
cron.schedule("*/55 * * * *", () => {
  fetchTransactionsPoly();
});
cron.schedule("*/59 * * * *", () => {
  fetchTransactionsAvax();
});
const apiKey = "3YNTZZKFCN9B5K2NJSK6URRQ5W9MU1ZA72";

const apiKeyEth = "GXUZQNXCXYHMAGCAPXHCHX5MQ79JFZWINH";

const apiKeyPolygon = "FJTZGXESHWNK59XG1CZWQMYUTK5SBFGAFI";

// ==============manual entry solutions=============

const getDepositetet = (data) => {
  const cleanData = data.slice(2);

  const methodId = cleanData.slice(0, 8);

  const amountHex = cleanData.slice(8, 72);
  const amount = parseInt(amountHex, 16);

  const investmentAmountHex = cleanData.slice(72, 136);
  const investmentAmount = parseInt(investmentAmountHex, 16);
  const amt = amount / 10 ** 18;
  return { methodId, amt, investmentAmount };
};

const getDepositeEth = (data) => {
  // Remove the '0x' prefix
  const cleanData = data.slice(2);

  // Extract method ID (first 8 characters)
  const methodId = cleanData.slice(0, 8);

  // Extract amount (next 64 characters)
  const amountHex = cleanData.slice(8, 72);
  const amount = parseInt(amountHex, 16);

  // Extract investment amount (next 64 characters)
  const investmentAmountHex = cleanData.slice(72, 136);
  const investmentAmount = parseInt(investmentAmountHex, 16);
  const amt = amount / 10 ** 6;
  return { methodId, amt, investmentAmount };
};

const getDepositePoly = (data) => {
  const cleanData = data.slice(2);

  const methodId = cleanData.slice(0, 8);

  const amountHex = cleanData.slice(8, 72);

  const amount = parseInt(amountHex, 16);

  const investmentAmountHex = cleanData.slice(72, 136);
  const investmentAmount = parseInt(investmentAmountHex, 16);

  const amt = amount / 10 ** 6;

  return { methodId, amt, investmentAmount };
};

const getDepositeAvax = (data) => {
  const cleanData = data.slice(2);

  const methodId = cleanData.slice(0, 8);

  const amountHex = cleanData.slice(8, 72);

  const amount = parseInt(amountHex, 16);

  const investmentAmountHex = cleanData.slice(72, 136);
  const investmentAmount = parseInt(investmentAmountHex, 16);

  const amt = amount / 10 ** 6;

  return { methodId, amt, investmentAmount };
};

const liveUsdtPriceEth = async () => {
  const provider = new JsonRpcProvider(ethRpcUrl);
  const contract = new Contract(gasWizardEthAddress, gasWizardEthabi, provider);
  const result = await contract.allPrice();

  let bnbPrice = Number(result[0]); //bnbPRice

  let tokenPrice = Number(result[1]);
  let tokenPriceDecimalVal = Number(result[2]);
  let tokenPriceDecimal = Math.pow(10, tokenPriceDecimalVal);
  let price = tokenPrice / tokenPriceDecimal;
  let priceLatest = Number(price)
    .toFixed(tokenPriceDecimalVal)
    .replace(/\.?0+$/, "");

  return { bnbPrice, tokenPrice: price };
};
const liveUsdtPricePoly = async () => {
  const provider = new JsonRpcProvider(polygonRpcUrl);
  const contract = new Contract(
    gasWizardPolygonAddress,
    gasWizardPolygonabi,
    provider
  );
  const result = await contract.allPrice();

  let bnbPrice = Number(result[0]); //bnbPRice

  let tokenPrice = Number(result[1]);
  let tokenPriceDecimalVal = Number(result[2]);
  let tokenPriceDecimal = Math.pow(10, tokenPriceDecimalVal);
  let price = tokenPrice / tokenPriceDecimal;
  let priceLatest = Number(price)
    .toFixed(tokenPriceDecimalVal)
    .replace(/\.?0+$/, "");
  return priceLatest;
};
const liveUsdtPriceAvax = async () => {
  const provider = new JsonRpcProvider(avalancheRpcUrl);
  const contract = new Contract(
    gasWizardAvalancheAddress,
    gasWizardAvalancheAbi,
    provider
  );
  const result = await contract.allPrice();

  let bnbPrice = Number(result[0]); //bnbPRice

  let tokenPrice = Number(result[1]);
  let tokenPriceDecimalVal = Number(result[2]);
  let tokenPriceDecimal = Math.pow(10, tokenPriceDecimalVal);
  let price = tokenPrice / tokenPriceDecimal;
  let priceLatest = Number(price)
    .toFixed(tokenPriceDecimalVal)
    .replace(/\.?0+$/, "");
  return priceLatest;
};
// ==============manual entry solutions=============
function executeQuery(query, params = "") {
  let param = JSON.parse(params);

  return new Promise((resolve, reject) => {
    db.query(query, param, (err, result) => {
      if (err) {
        // console.log(err, "err");
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
const liveUsdtPrice = async () => {
  const provider = new JsonRpcProvider(bscRpcUrl);
  const contract = new Contract(gasWizardAddress, gasWizardabi, provider);
  const result = await contract.allPrice();

  let bnbPrice = Number(result[0]); //bnbPRice

  let tokenPrice = Number(result[1]);
  let tokenPriceDecimalVal = Number(result[2]);
  let tokenPriceDecimal = Math.pow(10, tokenPriceDecimalVal);
  let price = tokenPrice / tokenPriceDecimal;
  let priceLatest = Number(price)
    .toFixed(tokenPriceDecimalVal)
    .replace(/\.?0+$/, "");
  return priceLatest;
};

exports.trnsactionAdd = async (req, res) => {
  const { chain, currency, amount, tokenAmount, status } = req.body;
  try {
    let chains;
    let currencys;

    const tAmt = Number(tokenAmount).toFixed(4);
    if (chain == chainType.binance) {
      chains = "Binance smart chain";
      if (currency == bnbCurrencyType.BNB) {
        currencys = "BNB";
      } else if (currency == bnbCurrencyType.WBTC) {
        currencys = "WBTC (BEP20)";
      } else if (currency == bnbCurrencyType.WETH) {
        currencys = "WETH (BEP20)";
      } else if (currency == bnbCurrencyType.USDT) {
        currencys = "USDT (BEP20)";
      } else if (currency == bnbCurrencyType.USDC) {
        currencys = "USDC (BEP20)";
      }
    } else {
      chains = "Ethereum";
      if (currency == ethersCurrencyType.ETHEREUM) {
        currencys = "ETHEREUM";
      } else if (currency == ethersCurrencyType.WBTC) {
        currencys = "WBTC (ERC20)";
      } else if (currency == ethersCurrencyType.USDT) {
        currencys = "USDT (ERC20)";
      } else if (currency == bnbCurrencyType.USDC) {
        currencys = "USDC (ERC20)";
      }
    }

    const query =
      "INSERT INTO transactions (user_id,chain, currency,amount,token_amount,status) VALUES (?,?,?,?, ?,?)";
    const params = [
      req.loginUserId,
      chains,
      currencys,
      amount,
      tAmt,
      "Success",
    ];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const user = checkQueryResult;

    if (user) {
      return res.send({
        status: true,
        message: "Transaction success",
        data: user,
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

exports.getTransaction = async (req, res) => {
  try {
    const query =
      "SELECT * FROM transactions WHERE wallet_address=? ORDER BY id DESC";
    const params = [req.body.address];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const user = checkQueryResult;
    // console.log(user,"user",req.body.address)
    const query1 =
      "SELECT SUM(token_amount) AS amount FROM transactions WHERE wallet_address=?";
    const params1 = [req.body.address];

    const checkQueryResult1 = await executeQuery(
      query1,
      JSON.stringify(params1)
    );
    const user1 = checkQueryResult1[0];

    const resulttt = await liveUsdtPrice();

    const querys =
      "SELECT bonus,usdt FROM users WHERE wallet_address=? ORDER BY id DESC";
    const paramss = [req.body.address];

    const checkQueryResults = await executeQuery(
      querys,
      JSON.stringify(paramss)
    );
    const queryRefferal =
      // "SELECT SUM(refferal_token_amt) AS referralAmount FROM transactions WHERE reffer_from=?";

      "SELECT SUM(transactions.refferal_token_amt) AS referralAmount FROM transactions LEFT JOIN users ON transactions.reffer_from = users.referral_code WHERE users.wallet_address=?";
    const paramsRefferal = [req.body.address];

    const checkQueryResultRefferal = await executeQuery(
      queryRefferal,
      JSON.stringify(paramsRefferal)
    );
    const users = checkQueryResults[0];

    if (resulttt) {
      const amounts = user1.amount * Number(resulttt);
      if (!user) {
        return res.send({
          status: false,
          message: "Transaction not found",
        });
      }
      if (user) {
        return res.send({
          status: true,
          message: "Transaction found",
          data: user,
          amount: parseInt(amounts),
          tokenAmt: parseInt(user1.amount),
          bonus: users?.bonus,
          referralAmount: Number(
            checkQueryResultRefferal[0]?.referralAmount
          ).toFixed(2),
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

// ============= metarequest =================//

exports.metaRequestInsert = async (req, res) => {
  const {
    chain,
    userAddress,
    currency,
    trans_id,
    amount,
    tokenAmount,
    reffer_from,
  } = req.body;

  let tokenAmt = Number(tokenAmount).toFixed(4);
  if (chain == chainType.binance) {
    let resulttt;
    resulttt = await liveUsdtPrice();
    if (currency == bnbCurrencyType.BNB) {
      const provider = new JsonRpcProvider(bscRpcUrl);
      const contract = new Contract(gasWizardAddress, gasWizardabi, provider);
      const result = await contract.allPrice();
      let bnbPrice = Number(result[0]);
      tokenAmt = (Number(amount) * bnbPrice) / (Number(resulttt) * 100000000);
    }
    if (currency == bnbCurrencyType.USDT || currency == bnbCurrencyType.USDC) {
      tokenAmt = Number(amount) / Number(resulttt);
    }
  } else if (chain == chainType.ethers) {
    let resulttt;

    const provider = new JsonRpcProvider(ethRpcUrl);
    const contract = new Contract(gasWizardEthAddress, gasWizardEthabi, provider);
    const result = await contract.allPrice();
    let bnbPrices = Number(result[0]);

    resulttt = await liveUsdtPrice();
    if (currency == ethersCurrencyType.ETHEREUM) {
      tokenAmt = (amount * Number(bnbPrices)) / (Number(resulttt) * 100000000);
    }
    if (
      currency == ethersCurrencyType.USDT ||
      currency == ethersCurrencyType.USDC
    ) {
      tokenAmt = Number(amount) / Number(resulttt);
    }
  } else if (chain == chainType.polygon) {
    let resulttt;
    // const  bnbPrice  = await liveUsdtPricePoly();
    // resulttt = await liveUsdtPrice();

    const provider = new JsonRpcProvider(polygonRpcUrl);
    const contract = new Contract(gasWizardPolygonAddress, gasWizardPolygonabi, provider);
    const result = await contract.allPrice();
    let bnbPrices = Number(result[0]);

    resulttt = await liveUsdtPrice();
    if (currency == polygonCurrencyType.MATIC) {
      tokenAmt = (amount * Number(bnbPrices)) / (Number(resulttt) * 100000000);
    }
    if (
      currency == polygonCurrencyType.USDT ||
      currency == polygonCurrencyType.USDC
    ) {
      tokenAmt = Number(amount) / Number(resulttt);
    }
  } else if (chain == chainType.avalanche) {
    let resulttt;

    const provider = new JsonRpcProvider(avalancheRpcUrl);
    const contract = new Contract(gasWizardAvalancheAddress, gasWizardAvalancheAbi, provider);
    const result = await contract.allPrice();
    let bnbPrices = Number(result[0]);

    resulttt = await liveUsdtPrice();
    if (currency == avalancheCurrencyType.AVAX) {
      tokenAmt = (amount * Number(bnbPrices)) / (Number(resulttt) * 100000000);
    }
    if (
      currency == avalancheCurrencyType.USDT ||
      currency == avalancheCurrencyType.USDC
    ) {
      tokenAmt = Number(amount) / Number(resulttt);
    }
  }
  try {
    const query = `INSERT INTO metarequests (wallet_address,reffer_from,chain,currency,trans_id,amount,tokenAmount,status,failed_check_count) VALUES (?,?,?,?,?,?,?,?,?)`;
    const params = [
      userAddress,
      reffer_from,
      chain,
      currency,
      trans_id,
      amount,
      tokenAmt,
      "Pending",
      1,
    ];

    const result = await executeQuery(query, JSON.stringify(params));

    if (result) {
      return res.send({
        status: true,
        message:
          "Transaction is being processed. Please wait for 60 seconds... Do not refresh the page.",
      });
    }
  } catch (err) {
    console.log(err, "uju");
  }
};

const checkTrxCron = async () => {
  try {
    const query = "SELECT * FROM metarequests WHERE status = ? LIMIT 5";
    const params1 = ["Pending"];

    const sqlRun = await executeQuery(query, JSON.stringify(params1));
  

    for (let i = 0; i < sqlRun.length; i++) {
      const transactionHandled = await handleTransaction(sqlRun[i]);
      if (transactionHandled) {
      } else {
      }
    }
  } catch (error) {
    console.error(error);
  }
};

// const handleTransaction = async (transaction) => {
//   const Web3 = require("web3");
//   try {
//     if (transaction.checkCount >= 6) {
//       await markTransactionFailed(transaction);
//       return false;
//     } else {
//       let checkUrl;

//       if (transaction.chain == chainType.binance) {
//         checkUrl = bscRpcUrl;
//       } else if (transaction.chain == chainType.ethers) {
//         checkUrl = ethRpcUrl;
//       } else if (transaction.chain == chainType.polygon) {
//         checkUrl = polygonRpcUrl;
//       } else if (transaction.chain == chainType.arbitrum) {
//         checkUrl = arbitrumRpcUrl;
//       } else if (transaction.chain == chainType.avalanche) {
//         checkUrl = avalancheRpcUrl;
//       }
//       // console.log(checkUrl, "checkUrl");
//       var httpWeb3 = new Web3(new Web3.providers.HttpProvider(checkUrl));

//       let txEthResp;
//       if (transaction.currency == "0") {
//         txEthResp = await httpWeb3.eth.getTransaction(transaction.trans_id);
//       } else {
//         txEthResp = await httpWeb3.eth.getTransactionReceipt(
//           transaction.trans_id
//         );
//       }

//       if (transaction.checkCount >= 6) {
//         if (!txEthResp || txEthResp.status !== true) {
//           await markTransactionFailed(transaction);
//           return false;
//         }
//       }

//       const log = txEthResp.logs;

//       let data;
//       let amount;

//       if (transaction.chain == chainType.binance) {
//         if (transaction.currency == "0") {
//           amount = txEthResp.value / 10 ** 18;
//         } else {
//           amount = log[0].data / 10 ** 18;
//         }
//       } else if (transaction.chain == chainType.ethers) {
//         if (transaction.currency == "0") {
//           amount = txEthResp.value / 10 ** 18;
//         } else if (transaction.currency == "1") {
//           data = log[0].data;
//           amount = data / 10 ** 8;
//         } else if (transaction.currency == "2" || transaction.currency == "3") {
//           data = log[0].data;
//           amount = data / 10 ** 6;
//         }
//       } else if (transaction.chain == chainType.polygon) {
//         if (transaction.currency == "0") {
//           amount = txEthResp.value / 10 ** 18;
//         } else {
//           amount = log[0].data / 10 ** 6;
//         }
//       } else if (
//         transaction.chain == chainType.arbitrum ||
//         transaction.chain == chainType.avalanche
//       ) {
//         if (transaction.currency == "0") {
//           amount = txEthResp.value / 10 ** 18;
//         } else {
//           amount = log[0].data / 10 ** 6;
//         }
//       }
//       let trxId;
//       if (transaction.currency == "0") {
//         trxId = txEthResp.hash;
//       } else {
//         trxId = txEthResp.transactionHash;
//       }

//       const from = txEthResp.from;
//       const chain = transaction.chain;
//       const currency = transaction.currency;
//       const user_id = transaction.user_id;
//       const tokenAmount = transaction.tokenAmount;
//       const address = transaction.wallet_address;
//       const reffer_from = transaction.reffer_from;

//       const refferal_token_amt = (Number(transaction.tokenAmount) * 10) / 100;

//       if (amount == transaction.amount) {
//         await completeTrx(
//           user_id,
//           chain,
//           currency,
//           from,
//           trxId,
//           amount,
//           tokenAmount,
//           transaction,
//           address,
//           reffer_from,
//           refferal_token_amt
//         );
//         const updateQuery =
//           "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
//         const params = [
//           "Success",
//           Number(transaction.checkCount) + 1,
//           transaction.id,
//         ];
//         await executeQuery(updateQuery, JSON.stringify(params));
//         return true;
//       } else {
//         let data;
//         let amount;
//         if (transaction.chain == chainType.binance) {
//           if (transaction.currency == "0") {
//             amount = txEthResp.value / 10 ** 18;
//           } else {
//             data = log[1].data;
//             amount = data / 10 ** 18;
//           }
//         } else {
//           if (transaction.currency == "0") {
//             amount = txEthResp.value / 10 ** 18;
//           } else {
//             data = log[1].data;
//             amount = data / 10 ** 18;
//           }
//         }

//         if (amount == transaction.amount) {
//           await completeTrx(
//             user_id,
//             chain,
//             currency,
//             from,
//             trxId,
//             amount,
//             tokenAmount,
//             transaction,
//             address,
//             reffer_from,
//             refferal_token_amt
//           );
//           const updateQuery =
//             "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
//           const params = [
//             "Success",
//             Number(transaction.checkCount) + 1,
//             transaction.id,
//           ];

//           await executeQuery(updateQuery, JSON.stringify(params));

//           return true;
//         }
//       }

//       await markTransactionPending(transaction);

//       return false;
//     }
//   } catch (error) {
//     console.error(error);
//     if (transaction.checkCount >= 6) {
//       await markTransactionFailed(transaction);
//       return false;
//     } else {
//       await markTransactionPending(transaction);
//       return false;
//     }
//   }
// };

const handleTransaction = async (transaction) => {
  const Web3 = require("web3");
  try {
    if (transaction.checkCount >= 6) {
      await markTransactionFailed(transaction);
      return false;
    } else {
      let checkUrl;

      if (transaction.chain == chainType.binance) {
        checkUrl = bscRpcUrl;
      } else if (transaction.chain == chainType.ethers) {
        checkUrl = ethRpcUrl;
      } else if (transaction.chain == chainType.polygon) {
        checkUrl = polygonRpcUrl;
      } else if (transaction.chain == chainType.arbitrum) {
        checkUrl = arbitrumRpcUrl;
      } else if (transaction.chain == chainType.avalanche) {
        checkUrl = avalancheRpcUrl;
      }

      var httpWeb3 = new Web3(new Web3.providers.HttpProvider(checkUrl));

      let txEthResp;
      if (transaction.currency == "0") {
        txEthResp = await httpWeb3.eth.getTransaction(transaction.trans_id);
      } else {
        txEthResp = await httpWeb3.eth.getTransactionReceipt(
          transaction.trans_id
        );
      }
console.log(txEthResp,"txEthResp");
      if (transaction.checkCount >= 6) {
        if (!txEthResp || txEthResp.status !== true) {
          await markTransactionFailed(transaction);
          return false;
        }
      }

      const log = txEthResp.logs;

      let data;
      let amount;
      // let timestamp;
      if (transaction.chain == chainType.binance) {
        if (transaction.currency == "0") {
          amount = txEthResp.value / 10 ** 18;
          // timestamp = txEthResp.Timestamp;
        } else {
          amount = log[0].data / 10 ** 18;
          // timestamp = log[0].Timestamp;
        }
      } else if (transaction.chain == chainType.ethers) {
        if (transaction.currency == "0") {
          // timestamp =  txEthResp.Timestamp
          amount = txEthResp.value / 10 ** 18;
        } else if (transaction.currency == "1") {
          data = log[0].data;
          amount = data / 10 ** 8;
          // timestamp =  log[0].Timestamp
        } else if (transaction.currency == "2" || transaction.currency == "3") {
          data = log[0].data;
          amount = data / 10 ** 6;
          // timestamp =  log[0].Timestamp
        }
      } else if (transaction.chain == chainType.polygon) {
        if (transaction.currency == "0") {
          // timestamp =  txEthResp.Timestamp
          amount = txEthResp.value / 10 ** 18;
        } else {
          amount = log[0].data / 10 ** 6;
          // timestamp =  log[0].Timestamp
        }
      } else if (
        transaction.chain == chainType.arbitrum ||
        transaction.chain == chainType.avalanche
      ) {
        if (transaction.currency == "0") {
          // timestamp =  txEthResp.Timestamp
          amount = txEthResp.value / 10 ** 18;
        } else {
          amount = log[0].data / 10 ** 6;
          // timestamp =  log[0].Timestamp
        }
      }
      let trxId;
      if (transaction.currency == "0") {
        trxId = txEthResp.hash;
      } else {
        trxId = txEthResp.transactionHash;
      }
 console.log(amount,"amount",transaction.amount);
      const from = txEthResp.from;
      const chain = transaction.chain;
      const currency = transaction.currency;
      const user_id = transaction.user_id;
      const tokenAmount = transaction.tokenAmount;
      const address = transaction.wallet_address;
      const reffer_from = transaction.reffer_from;

      const refferal_token_amt = (Number(transaction.tokenAmount) * 10) / 100;

      if (amount == transaction.amount) {
        // console.log("callupr");
        await completeTrx(
          user_id,
          chain,
          currency,
          from,
          trxId,
          amount,
          tokenAmount,
          transaction,
          address,
          reffer_from,
          refferal_token_amt
        );
    
        return true;
      } else {
        console.log("callniche===");
        let data;
        let amount;
        if (transaction.chain == chainType.binance) {
          if (transaction.currency == "0") {
            amount = txEthResp.value / 10 ** 18;
          } else {
            data = log[1].data;
            amount = data / 10 ** 18;
          }
        } else {
          if (transaction.currency == "0") {
            amount = txEthResp.value / 10 ** 18;
          } else {
            data = log[1].data;
            amount = data / 10 ** 18;
          }
        }

        if (amount == transaction.amount) {
          await completeTrx(
            user_id,
            chain,
            currency,
            from,
            trxId,
            amount,
            tokenAmount,
            transaction,
            address,
            reffer_from,
            refferal_token_amt
          );
         
          // const updateQuery =
          //   "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
          // const params = [
          //   "Success",
          //   Number(transaction.checkCount) + 1,
          //   transaction.id,
          // ];

          // await executeQuery(updateQuery, JSON.stringify(params));

          return true;
        }
      }

      await markTransactionPending(transaction);

      return false;
    }
  } catch (error) {
    console.log(error);
    if (transaction.checkCount >= 6) {
      await markTransactionFailed(transaction);
      return false;
    } else {
      await markTransactionPending(transaction);
      return false;
    }
  }
};
const markTransactionFailed = async (transactionId) => {
  const updateQuery =
    "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
  const params = [
    "Failed",
    Number(transactionId.checkCount) + 1,
    transactionId.id,
  ];

  await executeQuery(updateQuery, JSON.stringify(params));
};

const markTransactionPending = async (transactionId) => {
  const updateQuery =
    "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
  const params = [
    "Pending",
    Number(transactionId.checkCount) + 1,
    transactionId.id,
  ];

  await executeQuery(updateQuery, JSON.stringify(params));
};

const completeTrx = async (
  user_id,
  chain,
  currency,
  from,
  trxId,
  amount,
  tokenAmount,
  transaction,
  address,
  reffer_from,
  refferal_token_amt
) => {
  try {
    const currentDate = new Date();
    const date = currentDate / 1000;
    let chains;
    let currencys;
    const tAmt = Number(tokenAmount).toFixed(4);
    if (chain == chainType.binance) {
      chains = "Binance smart chain";
      if (currency == bnbCurrencyType.BNB) {
        currencys = "BNB";
      } else if (currency == bnbCurrencyType.WBTC) {
        currencys = "WBTC (BEP20)";
      } else if (currency == bnbCurrencyType.WETH) {
        currencys = "WETH (BEP20)";
      } else if (currency == bnbCurrencyType.USDT) {
        currencys = "USDT (BEP20)";
      } else if (currency == bnbCurrencyType.USDC) {
        currencys = "USDC (BEP20)";
      }
    } else if (chain == chainType.ethers) {
      chains = "Ethereum";
      if (currency == ethersCurrencyType.ETHEREUM) {
        currencys = "ETHEREUM";
      } else if (currency == ethersCurrencyType.WBTC) {
        currencys = "WBTC (ERC20)";
      } else if (currency == ethersCurrencyType.USDT) {
        currencys = "USDT (ERC20)";
      } else if (currency == bnbCurrencyType.USDC) {
        currencys = "USDC (ERC20)";
      }
    } else if (chain == chainType.polygon) {
      chains = "Polygon";
      if (currency == polygonCurrencyType.MATIC) {
        currencys = "MATIC";
      } else if (currency == polygonCurrencyType.USDT) {
        currencys = "USDT (Polygon)";
      } else if (currency == polygonCurrencyType.USDC) {
        currencys = "USDC (Polygon)";
      }
    } else if (chain == chainType.arbitrum) {
      chains = "Arbitrum";
      if (currency == arbitrumCurrencyType.ARBITRUM) {
        currencys = "ARB";
      } else if (currency == arbitrumCurrencyType.USDT) {
        currencys = "USDT (ARB)";
      } else if (currency == arbitrumCurrencyType.USDC) {
        currencys = "USDC (ARB)";
      }
    } else if (chain == chainType.avalanche) {
      chains = "Avalanche";
      if (currency == avalancheCurrencyType.AVAX) {
        currencys = "AVAX";
      } else if (currency == avalancheCurrencyType.USDT) {
        currencys = "USDT (AVAX)";
      } else if (currency == avalancheCurrencyType.USDC) {
        currencys = "USDC (AVAX)";
      }
    }

    const params = [address];
    const params1 = [reffer_from];
    const referralCodeResult = await executeQuery(
      "SELECT referral_code FROM users WHERE wallet_address = ?",
      JSON.stringify(params)
    );
    const referredByResult = await executeQuery(
      "SELECT referral_code FROM users WHERE referral_code = ?",
      JSON.stringify(params1)
    );

    const referredByExists = referredByResult.length > 0;
    const userHasReferralCode = referralCodeResult.length > 0;
    const tokenLivePrice = await liveUsdtPrice();
    let queryInsert;
    let paramsInsert;
  
    if (userHasReferralCode || reffer_from) {
      if (
        referredByExists &&
        reffer_from !== referralCodeResult[0]?.referral_code
      ) {
        console.log("ifffff===");
        queryInsert =
          "INSERT INTO transactions (user_id, chain, reffer_from, refferal_token_amt, currency, amount, trans_id, token_amount, wallet_address, status, type,equalInUsdt) VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        paramsInsert = [
          user_id,
          chains,
          reffer_from,
          refferal_token_amt,
          currencys,
          amount,
          trxId,
          Number(tokenAmount).toFixed(4),
          address,
          "Success",
          "referral",
          Number(Number(tokenAmount).toFixed(4)) * Number(tokenLivePrice),
        ];
      } else {
      
        queryInsert =
          "INSERT INTO transactions (user_id, chain, currency, amount, trans_id, token_amount, wallet_address, status,equalInUsdt) VALUES (?, ?, ?, ?, ?, ?, ?,?, ?)";
        paramsInsert = [
          user_id,
          chains,
          currencys,
          amount,
          trxId,
          Number(tokenAmount).toFixed(4),
          address,
          "Success",
          Number(Number(tokenAmount).toFixed(4)) * Number(tokenLivePrice),
        ];
      
      }
    } else {
   
      queryInsert =
        "INSERT INTO transactions (user_id, chain, currency, amount, trans_id, token_amount, wallet_address, status,equalInUsdt) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)";
      paramsInsert = [
        user_id,
        chains,
        currencys,
        amount,
        trxId,
        Number(tokenAmount).toFixed(4),
        address,
        "Success",
        Number(Number(tokenAmount).toFixed(4)) * Number(tokenLivePrice),
      ];
    }

   ;
    const updateQuery =
    "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
  const params2 = [
    "Success",
    Number(transaction.checkCount) + 1,
    transaction.id,
  ];
  await executeQuery(updateQuery, JSON.stringify(params2));
  await executeQuery(queryInsert, JSON.stringify(paramsInsert))
  } catch (error) {
    console.error(error);
    return { status: false, data: {}, message: "An error occurred" };
  }
};

// ==================metarequest=================//



// const completeTrx = async (
//   user_id,
//   chain,
//   currency,
//   from,
//   trxId,
//   amount,
//   tokenAmount,
//   transaction,
//   address,
//   reffer_from,
//   refferal_token_amt
// ) => {
//   try {
//     console.log(transaction,"transaction");
//     // console.log(chainType.polygon,"chainType.polygon")
//     // const currentDate = new Date();
//     // const date = currentDate / 1000;
//     let chains;
//     let currencys;
//     const tAmt = Number(tokenAmount).toFixed(4);
//     if (chain == chainType.binance) {
//       chains = "Binance smart chain";
//       if (currency == bnbCurrencyType.BNB) {
//         currencys = "BNB";
//       } else if (currency == bnbCurrencyType.WBTC) {
//         currencys = "WBTC (BEP20)";
//       } else if (currency == bnbCurrencyType.WETH) {
//         currencys = "WETH (BEP20)";
//       } else if (currency == bnbCurrencyType.USDT) {
//         currencys = "USDT (BEP20)";
//       } else if (currency == bnbCurrencyType.USDC) {
//         currencys = "USDC (BEP20)";
//       }
//     } else if (chain == chainType.ethers) {
//       chains = "Ethereum";
//       if (currency == ethersCurrencyType.ETHEREUM) {
//         currencys = "ETHEREUM";
//       } else if (currency == ethersCurrencyType.WBTC) {
//         currencys = "WBTC (ERC20)";
//       } else if (currency == ethersCurrencyType.USDT) {
//         currencys = "USDT (ERC20)";
//       } else if (currency == bnbCurrencyType.USDC) {
//         currencys = "USDC (ERC20)";
//       }
//     } else if (chain == chainType.polygon) {
//       chains = "Polygon";
//       if (currency == polygonCurrencyType.MATIC) {
//         currencys = "MATIC";
//       } else if (currency == polygonCurrencyType.USDT) {
//         currencys = "USDT (Polygon)";
//       } else if (currency == polygonCurrencyType.USDC) {
//         currencys = "USDC (Polygon)";
//       }
//     } else if (chain == chainType.arbitrum) {
//       chains = "Arbitrum";
//       if (currency == arbitrumCurrencyType.ARBITRUM) {
//         currencys = "ARB";
//       } else if (currency == arbitrumCurrencyType.USDT) {
//         currencys = "USDT (ARB)";
//       } else if (currency == arbitrumCurrencyType.USDC) {
//         currencys = "USDC (ARB)";
//       }
//     } else if (chain == chainType.avalanche) {
//       chains = "Avalanche";
//       if (currency == avalancheCurrencyType.AVAX) {
//         currencys = "AVAX";
//       } else if (currency == avalancheCurrencyType.USDT) {
//         currencys = "USDT (AVAX)";
//       } else if (currency == avalancheCurrencyType.USDC) {
//         currencys = "USDC (AVAX)";
//       }
//     }
//     let tokenAmt = Number(tokenAmount).toFixed(4);

//     if (chain == chainType.binance) {
//       let resulttt;
//       if (currency == bnbCurrencyType.BNB) {
//         resulttt = await liveUsdtPrice();
//         const provider = new JsonRpcProvider(bscRpcUrl);
//         const contract = new Contract(gasWizardAddress, gasWizardabi, provider);
//         const result = await contract.allPrice();
//         let bnbPrice = Number(result[0]);
//         tokenAmt = (Number(amount) * bnbPrice) / (Number(resulttt) * 100000000);
//       }
//       if (
//         currency == bnbCurrencyType.USDT ||
//         currency == bnbCurrencyType.USDC
//       ) {
//         tokenAmt = Number(amount) / Number(resulttt);
//       }
//     }

//     const params = [address];
//     const params1 = [reffer_from];
//     const referralCodeResult = await executeQuery(
//       "SELECT referral_code FROM users WHERE wallet_address = ?",
//       JSON.stringify(params)
//     );
//     const referredByResult = await executeQuery(
//       "SELECT referral_code FROM users WHERE referral_code = ?",
//       JSON.stringify(params1)
//     );

//     const referredByExists = referredByResult.length > 0;
//     const userHasReferralCode = referralCodeResult.length > 0;

//     let queryInsert;
//     let paramsInsert;

//     if (userHasReferralCode || reffer_from) {
  
//       if (
//         referredByExists &&
//         reffer_from !== referralCodeResult[0]?.referral_code
//       ) {

//         queryInsert =
//           "INSERT INTO transactions (user_id, chain, reffer_from, refferal_token_amt, currency, amount, trans_id, token_amount, wallet_address, status, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
//         paramsInsert = [
//           user_id,
//           chains,
//           reffer_from,
//           refferal_token_amt,
//           currencys,
//           amount,
//           trxId,
//           Number(tokenAmount).toFixed(4),
//           address,
//           "Success",
//           "referral",
//         ];
//       } else {
   
//         queryInsert =
//           "INSERT INTO transactions (user_id, chain, currency, amount, trans_id, token_amount, wallet_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
//         paramsInsert = [
//           user_id,
//           chains,
//           currencys,
//           amount,
//           trxId,
//           Number(tokenAmount).toFixed(4),
//           address,
//           "Success",
//         ];
//       }
//     } else {
//       queryInsert =
//         "INSERT INTO transactions (user_id, chain, currency, amount, trans_id, token_amount, wallet_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
//       paramsInsert = [
//         user_id,
//         chains,
//         currencys,
//         amount,
//         trxId,
//         tokenAmt,
//         address,
//         "Success",
//       ];
//     }
   

//     const data = await executeQuery(queryInsert, JSON.stringify(paramsInsert));
//     const updateQuery =
//     "UPDATE metarequests SET status = ?, checkCount = ? WHERE id = ?";
//   const params2 = [
//     "Success",
//     Number(transaction.checkCount) + 1,
//     transaction.id,
//   ];
//   await executeQuery(updateQuery, JSON.stringify(params2));
//   } catch (error) {
//     console.log(error, "uiojrefg");
//     return { status: false, data: {}, message: "An error occurred" };
//   }
// };


exports.TransactionData = async (req, res) => {
  try {
    const query = "SELECT * FROM transactions ORDER BY id DESC";
    const params = [];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: true,
        message: "Transaction data found successfully",
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

exports.getTransactionTotal = async (req, res) => {
  try {
    const query1 = "SELECT SUM(token_amount) AS amount FROM transactions";
    const params1 = [];

    const checkQueryResult1 = await executeQuery(
      query1,
      JSON.stringify(params1)
    );
    const query2 = "SELECT SUM(equalInUsdt) AS totalUsdt FROM transactions";
    const params2 = [];
    const checkQueryResult2 = await executeQuery(
      query2,
      JSON.stringify(params2)
    );
    // console.log(checkQueryResult2[0].totalUsdt, "ygyg");
    const resulttt = await liveUsdtPrice();
    if (resulttt) {
      const amounts = checkQueryResult1[0].amount * Number(resulttt);
      // console.log(amounts, "amounts");
      if (checkQueryResult1 || checkQueryResult2) {
        return res.send({
          status: true,
          message: "Transaction found",

          amount: Number(amounts),
          tokenAmt: Number(checkQueryResult1[0].amount),
          usdtAmt: Number(checkQueryResult2[0].totalUsdt),
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

// ===============add update bonus==============//

exports.bonusAddUpdate = async (req, res) => {
  const { bonus, usdt, id } = req.body;

  const query = `UPDATE users SET usdt = ?, bonus = ? WHERE id = ?`;
  const params = [Number(usdt), Number(bonus), id];
  const result = await executeQuery(query, JSON.stringify(params));

  if (result) {
    return res.send({
      status: true,
      message: "Bonus Updated sucessfully",
    });
  }
};

// =============== referral history =================//

exports.referralData = async (req, res) => {
  try {
    const query =
      "SELECT  users.wallet_address AS user_wallet_address, transactions.refferal_token_amt,transactions.chain,transactions.currency, transactions.wallet_address AS to_referral_wallet_address,transactions.status,transactions.created_at FROM transactions LEFT JOIN  users ON transactions.reffer_from = users.referral_code WHERE transactions.type = ? ORDER BY  transactions.id DESC";

    const params = ["referral"];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: true,
        message: "Referral data found successfully",
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
// exports.referralData = async (req, res) => {
//   try {
//     const query =
//       "SELECT  users.wallet_address AS user_wallet_address, transactions.refferal_token_amt,transactions.chain,transactions.currency, transactions.wallet_address AS to_referral_wallet_address,transactions.status,transactions.created_at FROM transactions LEFT JOIN  users ON transactions.reffer_from = users.referral_code WHERE transactions.type = ? ORDER BY  transactions.id DESC";

//     const params = ["referral"];

//     const checkQueryResult = await executeQuery(query, JSON.stringify(params));

//     if (checkQueryResult.length > 0) {
//       return res.send({
//         status: true,
//         message: "Referral data found successfully",
//         data: checkQueryResult,
//       });
//     }
//   } catch (error) {
//     console.error("Error during login:", error);
//     return res.send({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

// async function generateReferralCodeAsync() {
//   return new Promise((resolve, reject) => {
//     const characters =
//       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//     let referralCode = "";
//     for (let i = 0; i < 8; i++) {
//       referralCode += characters.charAt(
//         Math.floor(Math.random() * characters.length)
//       );
//     }

//     setTimeout(() => {
//       resolve(referralCode);
//     }, 1000);
//   });
// }

// exports.generateReferalCode = async (req, res) => {
//   const query = "SELECT referral_code FROM users WHERE wallet_address = ?";
//   const params = [req.body.wallet_address];

//   const checkQueryResult = await executeQuery(query, JSON.stringify(params));

//   if (checkQueryResult?.length > 0) {
//     return res.send({
//       status: true,
//       message: "Referral Code found successfully",
//       data: checkQueryResult[0].referral_code,
//     });
//   } else {
//     const referralCode = await generateReferralCodeAsync();
//     const query = `UPDATE users SET referral_code = ? WHERE wallet_address = ?`;
//     const params = [referralCode, req.body.wallet_address];
//     const result = await executeQuery(query, JSON.stringify(params));
//     if (result) {
//       return res.send({
//         status: true,
//         message: "Referral Code Generate successfully",
//         data: referralCode,
//       });
//     }
//   }
// };

async function generateReferralCodeAsync() {
  return new Promise((resolve, reject) => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let referralCode = "";
    for (let i = 0; i < 8; i++) {
      referralCode += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    setTimeout(() => {
      resolve(referralCode);
    }, 1000);
  });
}

exports.generateReferalCode = async (req, res) => {
  const query = "SELECT referral_code FROM users WHERE wallet_address = ?";
  const params = [req.body.wallet_address];

  const checkQueryResult = await executeQuery(query, JSON.stringify(params));

  if (checkQueryResult[0]?.referral_code) {
    return res.send({
      status: true,
      message: "Referral Code found successfully",
      data: checkQueryResult[0]?.referral_code,
    });
  } else {
    const referralCode = await generateReferralCodeAsync();
    const query = `UPDATE users SET referral_code = ? WHERE wallet_address = ?`;
    const params = [referralCode, req.body.wallet_address];
    const result = await executeQuery(query, JSON.stringify(params));
    if (result) {
      return res.send({
        status: true,
        message: "Referral Code Generate successfully",
        data: referralCode,
      });
    }
  }
};
const checkFailedTrx = async () => {
  try {
    const query =
      "SELECT * FROM metarequests WHERE status = ? AND failed_check_count < 6 LIMIT 5";
    const params1 = ["Failed"];

    const sqlRun = await executeQuery(query, JSON.stringify(params1));
    console.log(sqlRun, "sqlRun");

    for (let i = 0; i < sqlRun.length; i++) {
      const transactionHandled = await handleTransactionForFailed(sqlRun[i]);
      if (transactionHandled) {
      } else {
      }
    }
  } catch (error) {
    console.error(error);
  }
};

const handleTransactionForFailed = async (transaction) => {
  try {
    if (transaction.failed_check_count >= 6) {
      await markTransactionAllFailed(transaction);
      return false;
    } else {
      await markFailedPending(transaction);
      return false;
    }
  } catch (error) {
    if (transaction.failed_check_count >= 6) {
      await markTransactionAllFailed(transaction);
      return false;
    }
  }
};
const markFailedPending = async (transactionId) => {
  const updateQuery =
    "UPDATE metarequests SET status = ?,	failed_check_count=?,mark_Failed_status=?, checkCount = ? WHERE id = ?";
  const params = [
    "Pending",
    Number(transactionId.failed_check_count) + 1,
    "Pending",
    0,
    transactionId.id,
  ];

  await executeQuery(updateQuery, JSON.stringify(params));
};
const markTransactionAllFailed = async (transactionId) => {
  const updateQuery =
    "UPDATE metarequests SET mark_Failed_status = ?, failed_check_count = ? WHERE id = ?";
  const params = [
    "Failed",
    Number(transactionId.checkCount) + 1,
    transactionId.id,
  ];

  await executeQuery(updateQuery, JSON.stringify(params));
};

// =============manual entry ================================//

exports.manualEntryInsert = async (req, res) => {
  const { chain, wallet_address, currency, trans_id, amount, tokenAmount, id } =
    req.body;

  if (id) {
    const query =
      "UPDATE metarequests SET wallet_address = ?, chain = ?, currency = ?, amount = ?, tokenAmount = ?, status = ?,failed_check_count = ?, entry_type = ?,trans_id=? WHERE id = ?";
    const params = [
      wallet_address,
      chain,
      currency,
      amount,
      tokenAmount,
      "Pending",
      1,
      "Admin",
      trans_id,
      id,
    ];
    const result = await executeQuery(query, JSON.stringify(params));
    if (result) {
      return res.send({
        status: true,
        message:
          "Entry updated successfully. Please wait while we check the transaction. We will update you shortly.",
      });
    }
  } else {
    const query = `INSERT INTO metarequests (wallet_address,chain,currency,trans_id,amount,tokenAmount,status,failed_check_count,entry_type) VALUES (?,?,?,?,?,?,?,?,?)`;
    const params = [
      wallet_address,
      chain,
      currency,
      trans_id,
      amount,
      tokenAmount,
      "Pending",
      1,
      "Admin",
    ];
    const result = await executeQuery(query, JSON.stringify(params));

    if (result) {
      return res.send({
        status: true,
        message:
          "Entry submitted successfully. Please wait while we check the transaction. We will update you shortly.",
      });
    }
  }
};
exports.manualEntryData = async (req, res) => {
  try {
    const query =
      "SELECT * FROM metarequests WHERE entry_type=? ORDER BY id DESC";
    const params = ["Admin"];

    const checkQueryResult = await executeQuery(query, JSON.stringify(params));

    if (checkQueryResult.length > 0) {
      return res.send({
        status: true,
        message: "Transaction data found successfully",
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

// ============= manual entry solutions======================//
// ==========bnb===============

async function fetchTransactions(
  offset,

  startBlock = 0,
  endBlock = 99999999,
  page = 1,

  sort = "desc"
) {
  offset = Number(offset) || 30;


  const url = `https://api.bscscan.com/api?module=account&action=txlist&address=${gasWizardAddress}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKey}`;

  const query =
    "SELECT trans_id FROM metarequests WHERE chain = ? ORDER BY created_at DESC LIMIT ?";
  const params = ["0", offset];

  const checkQueryResult = await executeQuery(query, JSON.stringify(params));

  try {
    const response = await axios.get(url);
    const data = response.data.result;


    const date = new Date(data[0].timeStamp * 1000);

    const existingTransactionIds = checkQueryResult.map(
      (entry) => entry.trans_id
    );

    const filteredData = data.filter((transaction) => {
      return (
        !existingTransactionIds.includes(transaction.hash) &&
        transaction.isError == "0"
      );
    });

    const buyWithBnbToken = filteredData.filter(
      (transaction) => transaction.functionName.split("(")[0] == "buyWithToken"
    );

    
    const buyWithBnbs = filteredData.filter(
      (transaction) =>
        transaction.functionName.split("(")[0] == "buyTokenWithbnb"
    );
    // console.log(buyWithBnbs,"buyWithBnbs");
 
    await processBuyWithBnbTokenTransactions(buyWithBnbToken);
    await processBuyWithBnbTransactions(buyWithBnbs);

    return true;
  } catch (error) {
    throw error;
  }
}
async function processBuyWithBnbTokenTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash } = transaction;

    const { amt, investmentAmount } = getDepositetet(transaction.input);
    const resulttt = await liveUsdtPrice();

    const token = Number(amt) / Number(resulttt);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [from, 0, investmentAmount, hash, amt, token, "Pending", 1];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      console.log("Error inserting buyWithToken transaction:", error);
    }
  }
}
async function processBuyWithBnbTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash, value, timeStamp } = transaction;

    let amts = value;

    amts = Number(amts) / 10 ** 18;

    const resulttt = await liveUsdtPrice();

    const token = Number(amts) / Number(resulttt);

    const provider = new JsonRpcProvider(bscRpcUrl);
    const contract = new Contract(gasWizardAddress, gasWizardabi, provider);
    const result = await contract.allPrice();
    let bnbPrice = Number(result[0]);

    const tknAmt = (amts * bnbPrice) / (Number(resulttt) * 100000000);

    const query = `INSERT INTO metarequests (wallet_address,chain,currency,trans_id,amount,tokenAmount,status,failed_check_count) VALUES (?,?,?,?,?,?,?,?)`;
    const params = [from, 0, 0, hash, amts, tknAmt, "Pending", 1];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      console.log("Error inserting buyWithToken transaction:", error);
    }
  }
}
// ==========bnb===============//

// ============eth=========

async function fetchTransactionsEth(
  offset,

  startBlock = 0,
  endBlock = 99999999,
  page = 1,

  sort = "desc"
) {
  offset = Number(offset) || 30;

  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${gasWizardEthAddress}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKeyEth}`;

  const query =
    "SELECT trans_id FROM metarequests WHERE chain = ? ORDER BY created_at DESC LIMIT ?";
  const params = ["1", offset];

  const checkQueryResult = await executeQuery(query, JSON.stringify(params));

  try {
    const response = await axios.get(url);
    const data = response.data.result;

    const existingTransactionIds = checkQueryResult.map(
      (entry) => entry.trans_id
    );

    const filteredData = data.filter((transaction) => {
      return (
        !existingTransactionIds.includes(transaction.hash) &&
        transaction.isError === "0"
      );
    });

    const buyWithEthToken = filteredData.filter(
      (transaction) => transaction.functionName.split("(")[0] == "buyWithToken"
    );
    const buyWithEths = filteredData.filter(
      (transaction) =>
        transaction.functionName.split("(")[0] == "buyTokenWithETH"
    );

    await processBuyWithEthTokenTransactions(buyWithEthToken);
    await processBuyWithEthTransactions(buyWithEths);
    return true;
  } catch (error) {
    // console.log("Error fetching data:", error);
    throw error;
  }
}

async function processBuyWithEthTokenTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash } = transaction;

    const { amt, investmentAmount } = getDepositeEth(transaction.input);

    const resulttt = await liveUsdtPrice();
    const token = Number(amt) / Number(resulttt);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [from, 1, investmentAmount, hash, amt, token, "Pending", 1];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      console.log("Error inserting buyWithToken transaction:", error);
    }
  }
}
async function processBuyWithEthTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash, value } = transaction;

    let amts = value;

    amts = Number(amts) / 10 ** 18;

    const { tokenPrice, bnbPrice } = await liveUsdtPriceEth();

    const tknAmt = (amts * bnbPrice) / (tokenPrice * 100000000);

    const query = `INSERT INTO metarequests (wallet_address,chain,currency,trans_id,amount,tokenAmount,status,failed_check_count) VALUES (?,?,?,?,?,?,?,?)`;
    const params = [from, 1, 0, hash, amts, tknAmt, "Pending", 1];

    try {
      const result = await executeQuery(query, JSON.stringify(params));
      return true;
    } catch (error) {
      // console.log("Error inserting data:", error);
    }
  }
}

// ============eth=========

// ============== polygon==================//

async function fetchTransactionsPoly(
  offset,

  startBlock = 0,
  endBlock = 99999999,
  page = 1,
  sort = "desc"
) {
  offset = Number(offset) || 30;

  const url = `https://api.polygonscan.com/api?module=account&action=txlist&address=${gasWizardPolygonAddress}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${apiKeyPolygon}`;

  const query =
    "SELECT trans_id FROM metarequests WHERE chain = ? ORDER BY created_at DESC LIMIT ?";
  const params = ["2", offset];

  try {
    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const response = await axios.get(url);
    const data = response.data.result;

    const existingTransactionIds = checkQueryResult.map(
      (entry) => entry.trans_id
    );

    const filteredData = data.filter((transaction) => {
      return (
        !existingTransactionIds.includes(transaction.hash) &&
        transaction.isError === "0"
      );
    });

    const buyWithTokenPolyTransactions = filteredData.filter(
      (transaction) => transaction.functionName.split("(")[0] === "buyWithToken"
    );

    const buyWithMaticTransactions = filteredData.filter(
      (transaction) =>
        transaction.functionName.split("(")[0] === "buyTokenWithMATIC"
    );

    await processBuyWithPolygoTokenTransactions(buyWithTokenPolyTransactions);
    await processBuyWithPolygonTransactions(buyWithMaticTransactions);
    return true;
  } catch (error) {
    console.log("Error fetching data:", error);
    throw error;
  }
}

async function processBuyWithPolygoTokenTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash, input } = transaction;

    const { amt, investmentAmount } = getDepositePoly(input);

    const usdtPrice = await liveUsdtPrice();
    const tokenAmount = Number(amt) / Number(usdtPrice);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      from,
      2,
      investmentAmount,
      hash,
      amt,
      tokenAmount,
      "Pending",
      1,
    ];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      console.log("Error inserting buyWithToken transaction:", error);
    }
  }
}

async function processBuyWithPolygonTransactions(transactions) {
  const provider = new JsonRpcProvider(polygonRpcUrl);
  const contract = new Contract(
    gasWizardPolygonAddress,
    gasWizardPolygonabi,
    provider
  );
  const allPrices = await contract.allPrice();
  const bnbPrice = Number(allPrices[0]);

  for (const transaction of transactions) {
    const { from, hash, value } = transaction;
    const amountInBnb = Number(value) / 10 ** 18;
    const usdtPrice = await liveUsdtPricePoly();
    const tokenAmount =
      (amountInBnb * bnbPrice) / (Number(usdtPrice) * 100000000);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [from, 2, 0, hash, amountInBnb, tokenAmount, "Pending", 1];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      console.log("Error inserting buyWithBnb transaction:", error);
    }
  }
}

// ============ manual entry avax solutions ==========================//

async function fetchTransactionsAvax(
  offset,

  startBlock = 0,
  endBlock = 99999999,
  page = 1,

  sort = "desc"
) {
  offset = Number(offset) || 30;

  const url = `https://api.snowtrace.io/api?module=account&action=txlist&address=${gasWizardAvalancheAddress}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=$`;

  const query =
    "SELECT trans_id FROM metarequests WHERE chain = ? ORDER BY created_at DESC LIMIT ?";
  const params = ["4", offset];

  try {
    const checkQueryResult = await executeQuery(query, JSON.stringify(params));
    const response = await axios.get(url);
    const data = response.data.result;

    const existingTransactionIds = checkQueryResult.map(
      (entry) => entry.trans_id
    );

    const filteredData = data.filter((transaction) => {
      return (
        !existingTransactionIds.includes(transaction.hash) &&
        transaction.isError === "0"
      );
    });

    const buyWithTokenTransactions = filteredData.filter(
      (transaction) => transaction.functionName.split("(")[0] === "buyWithToken"
    );

    const buyWithAvaxTransactions = filteredData.filter(
      (transaction) =>
        transaction.functionName.split("(")[0] === "buyTokenWithAVAX"
    );

    await processBuyWithTokenTransactions(buyWithTokenTransactions);
    await processBuyWithAvaxTransactions(buyWithAvaxTransactions);
    return true;
  } catch (error) {
    // console.log("Error fetching data:", error);
    throw error;
  }
}

async function processBuyWithTokenTransactions(transactions) {
  for (const transaction of transactions) {
    const { from, hash, input } = transaction;

    const { amt, investmentAmount } = getDepositeAvax(input);

    const usdtPrice = await liveUsdtPrice();
    const tokenAmount = Number(amt) / Number(usdtPrice);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      from,
      4,
      investmentAmount,
      hash,
      amt,
      tokenAmount,
      "Pending",
      1,
    ];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      // console.log("Error inserting buyWithToken transaction:", error);
    }
  }
}

async function processBuyWithAvaxTransactions(transactions) {
  const provider = new JsonRpcProvider(avalancheRpcUrl);
  const contract = new Contract(
    gasWizardAvalancheAddress,
    gasWizardAvalancheAbi,
    provider
  );
  const allPrices = await contract.allPrice();
  const bnbPrice = Number(allPrices[0]);

  for (const transaction of transactions) {
    const { from, hash, value } = transaction;
    const amountInBnb = Number(value) / 10 ** 18;
    const usdtPrice = await liveUsdtPriceAvax();
    const tokenAmount =
      (amountInBnb * bnbPrice) / (Number(usdtPrice) * 100000000);

    const query = `INSERT INTO metarequests (wallet_address, chain, currency, trans_id, amount, tokenAmount, status, failed_check_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [from, 4, 0, hash, amountInBnb, tokenAmount, "Pending", 1];

    try {
      await executeQuery(query, JSON.stringify(params));
    } catch (error) {
      // console.log("Error inserting buyWithBnb transaction:", error);
    }
  }
}

exports.manualCron = async (req, res) => {
  const { chainTypes, offset } = req.body;

  const fetchFunctions = {
    [chainType.binance]: fetchTransactions,
    [chainType.ethers]: fetchTransactionsEth,
    [chainType.polygon]: fetchTransactionsPoly,
    [chainType.avalanche]: fetchTransactionsAvax,
  };

  try {
    if (fetchFunctions[chainTypes]) {
      const result = await fetchFunctions[chainTypes](offset);

      if (result) {
        return res.send({ message: "Cron Updated Successfully" });
      } else {
        return res.send({ message: "Failed to update cron" });
      }
    } else {
      return res.send({ message: "Invalid chain type" });
    }
  } catch (error) {
    console.error("Error in manualCron:", error);
    res.send({ message: "Internal Server Error" });
  }
};



 
