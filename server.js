require("monero-javascript");
require('dotenv').config()
var qrcode = require("qrcode-generator");
var express = require("express");
const bodyParser = require("body-parser");
var app = express();
var admin_app = express();

app.set("view engine", "pug");
admin_app.set("view engine", "pug");
var server = require("http").createServer(app);
var admin_server = require("http").createServer(admin_app);
var io = require('socket.io')(server);
var io2 = require('socket.io')(admin_server);

var name, message, subaddress, amount;

mainFunction();

async function mainFunction() {

  // connect to a monero-wallet-rpc endpoint with authentication
  let walletRpc = new MoneroWalletRpc(
    process.env.MONERO_WALLET_RPC_URI,
    process.env.MONERO_WALLET_RPC_USER,
    process.env.MONERO_WALLET_RPC_PASSWORD
  );

  // open a wallet on the server
  await walletRpc.openWallet("testwallet", "abc");
  let primaryAddress = await walletRpc.getPrimaryAddress();
  let balance = await walletRpc.getBalance();
  console.log("Wallet:", process.env.WALLET_NAME);
  console.log("Primary address:", primaryAddress);
  console.log("Balance:" + (balance / Math.pow(10, 12)) + " XMR");

  async function generateNewSubaddress(label) {
    let subaddress = await walletRpc.createSubaddress(0, label);
    console.log("New Subaddress:", subaddress.state.address);
    return await subaddress.state.address;
  }

  // starting webserver
  server.listen(process.env.PORT_WEBSERVER, function () {
    console.log(`Express running on port ${server.address().port}`);
  });

  // starting admin webserver
  admin_server.listen(process.env.PORT_ADMINSERVER, function () {
    console.log(`Admin Server running on port ${admin_server.address().port}`);
  });

  io.on('connection', (socket) => {
    console.log('User connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');

    });
  });

  app.get("/", function (req, res) {
    res.render(process.env.PLATFORM, {
      title: "Donate to your favorite Streamer with Monero",
      streamerName: process.env.STREAMER_NAME,
      platform: process.env.PLATFORM
    });
  });

  admin_app.get("/animation", function (req, res) {
    res.render("animation");
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
          let payments = await walletRpc.getTransfers({
            IsIncoming: true,
            address: subaddress,
          });

          for (var payment of payments) {
            if (payment.state.address == subaddress) {
              amount = await payment.state.amount;
              console.log(
                "Transaction incoming: " +
                (await amount) / Math.pow(10, 12) +
                " XMR from: " +
                subaddress
              );
              //console.dir(payment, { depth: null });
              clearInterval(checkForPayment);
              next();
            }
          }
        },
        1000,
        subaddress
      );
    },
    function (req, res) {
      // Send payment recieved with amount to Client
      io.emit('payment_recieved', (amount / Math.pow(10, 12)), name);

      // Generate Animation for OBS
      io2.emit('new_donation', (amount / Math.pow(10, 12)), name, message);

      // Confirmations
      var confirmations_old = 0;
      var checkConfirmations = setInterval(
        async () => {
          let payments = await walletRpc.getTransfers({
            IsIncoming: true,
            address: subaddress,
          });

          for (var payment of payments) {
            if (payment.state.address == subaddress) {
              var confirmations_new = await payment.state.tx.state.numConfirmations;
              if (confirmations_new > confirmations_old) {
                confirmations_old = confirmations_new;
                console.log('New confirmation:', confirmations_new);
                io.emit('confirmations', confirmations_new);
              }
            }
          }
        },
        10000,
        subaddress
      );
    }
  );
}

