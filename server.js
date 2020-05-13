require("monero-javascript");
var qrcode = require("qrcode-generator"); //https://www.npmjs.com/package/qrcode-generator
var express = require("express");
const bodyParser = require("body-parser");
const util = require("util");
var app = express();
app.set("view engine", "pug");
var server = require("http").createServer(app);
var port = 3000;
let walletName = "testwallet";
let walletPassword = "abc";

mainFunction();

async function mainFunction() {
  // connect to a daemon
  let daemon = new MoneroDaemonRpc({
    uri: "http://localhost:28081",
  });
  let height = await daemon.getHeight();
  console.log("Height:", height);

  // connect to a monero-wallet-rpc endpoint with authentication
  let walletRpc = new MoneroWalletRpc(
    "http://localhost:28083",
    "grischa",
    "abc"
  );

  // open a wallet on the server
  await walletRpc.openWallet(walletName, walletPassword);
  let primaryAddress = await walletRpc.getPrimaryAddress();
  let balance = await walletRpc.getBalance();
  console.log("Wallet:", walletName);
  console.log("Address:", primaryAddress);
  console.log("Balance:", balance / Math.pow(10, 12));

  async function generateNewSubaddress(label) {
    let subaddress = await walletRpc.createSubaddress(0, label);
    console.log("New Subaddress:", subaddress.state.address);
    return await subaddress.state.address;
  }

  // Webserver starten
  server.listen(port, function () {
    console.log(`Express running on port ${server.address().port}`);
  });

  app.get("/", function (req, res) {
    res.render("index", {
      title: "Twitch Donation",
    });
  });

  var name, message;

  app.use(bodyParser.urlencoded({ extended: true }));
  app.post("/submit", async function (req, res) {
    name = req.body.name;
    message = req.body.message;

    let subaddress = await generateNewSubaddress(name + " - " + message);

    var typeNumber = 0;
    var errorCorrectionLevel = "L";
    var qr = qrcode(typeNumber, errorCorrectionLevel);
    qr.addData(await subaddress);
    await qr.make();
    let qrcodeURL = await qr.createDataURL(6);

    res.render("waiting-for-payment", {
      subaddress: subaddress,
      qrcode: qrcodeURL,
      name: name,
      message: message,
    });

    var checkForPayment = setInterval(
      async () => {
        let transferQuery = new MoneroTransferQuery().setIsIncoming(true);
        let payments = await walletRpc.getTransfers(transferQuery);

        for (var payment of payments) {
          //console.dir(payment.state);

          if (payment.state.address == subaddress) {
            console.log(
              "Transaction incoming: " +
                (await payment.state.amount) / Math.pow(10, 12) +
                " XMR from: " +
                subaddress
            );
            clearInterval(checkForPayment);
          } else {
            console.log("No Payment recieved");
          }
        }
      },
      1000,
      subaddress
    );
  });
}
