require("monero-javascript");
var qrcode = require("qrcode-generator"); //https://www.npmjs.com/package/qrcode-generator
var express = require("express");
const bodyParser = require("body-parser");
var app = express();

app.set("view engine", "pug");
var server = require("http").createServer(app);
var io = require('socket.io')(server);
var port = 3000;

let walletName = "testwallet";
let walletPassword = "abc";

var name, message, subaddress, amount;

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

  io.on('connection', (socket) => {
    console.log('User connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  app.get("/", function (req, res) {
    res.render("index", {
      title: "Twitch Donation",
    });
  });



  app.use(bodyParser.urlencoded({ extended: true }));
  app.post(
    "/payment",
    async function (req, res, next) {
      name = req.body.name;
      message = req.body.message;

      subaddress = await generateNewSubaddress(name + " - " + message);

      // QR Code generieren
      var typeNumber = 0;
      var errorCorrectionLevel = "L";
      var qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(await subaddress);
      await qr.make();
      let qrcodeURL = await qr.createDataURL(6);

      res.render("payment", {
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
            if (payment.state.address == subaddress) {
              amount = await payment.state.amount;
              console.log(
                "Transaction incoming: " +
                (await amount) / Math.pow(10, 12) +
                " XMR from: " +
                subaddress
              );
              console.dir(payment, { depth: null });
              clearInterval(checkForPayment);
              next();
            } else {
              console.log("No Payment recieved");
            }
          }
        },
        1000,
        subaddress
      );
    },
    function (req, res) {
      io.emit('payment_recieved', (amount / Math.pow(10, 12)), name);

      var checkConfirmations = setInterval(
        async () => {
          let transferQuery = new MoneroTransferQuery().setIsIncoming(true);
          let payments = await walletRpc.getTransfers(transferQuery);

          for (var payment of payments) {
            if (payment.state.address == subaddress) {
              confirmations = await payment.state.numConfirmations;
            }
          }
        },
        1000,
        subaddress
      );
    }
  );
}

