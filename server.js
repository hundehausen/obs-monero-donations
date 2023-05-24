require("dotenv").config();
const monerojs = require("monero-javascript");
const { connectToWalletRpc } = monerojs;
const escape = require("escape-html");
const qrcode = require("qrcode-generator");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const adminApp = express();

app.set("view engine", "pug");
app.use(bodyParser.urlencoded({ extended: true }));
adminApp.set("view engine", "pug");
const server = require("http").createServer(app);
const adminServer = require("http").createServer(adminApp);
const io = require("socket.io")(server, {
  pingInterval: 2500,
});
const io2 = require("socket.io")(adminServer, {
  pingInterval: 2500,
});
let name, message, subaddress, amount;

async function mainFunction() {
  // connect to a monero-wallet-rpc endpoint with authentication
  const walletRpc = await connectToWalletRpc(
    process.env.MONERO_WALLET_RPC_URI,
    process.env.MONERO_WALLET_RPC_USER,
    process.env.MONERO_WALLET_RPC_PASSWORD
  );

  // open a wallet on the server
  await walletRpc.openWallet(
    process.env.WALLET_NAME,
    process.env.WALLET_PASSWORD
  );
  const primaryAddress = await walletRpc.getPrimaryAddress();
  const balance = await walletRpc.getBalance();
  console.log("Wallet:", process.env.WALLET_NAME);
  console.log("Primary address:", primaryAddress);
  console.log(`Balance: ${balance / Math.pow(10, 12)} XMR`);

  async function generateNewSubaddress(label) {
    const subaddress = await walletRpc.createSubaddress(0, label);
    console.log("New Subaddress:", subaddress.state.address);
    return subaddress.state.address;
  }

  // starting webserver
  server.listen(process.env.PORT_WEBSERVER, function () {
    console.log(`Express running on port ${server.address().port}`);
  });

  // starting admin webserver
  adminServer.listen(process.env.PORT_ADMINSERVER, function () {
    console.log(`Admin Server running on port ${adminServer.address().port}`);
  });

  io.on("connection", (socket) => {
    console.log("User connected");
    socket.on("disconnect", () => {
      console.log("user disconnected");
    });
  });

  app.get("/", function (req, res) {
    res.render(process.env.PLATFORM, {
      title: "Donate to your favorite Streamer with Monero",
      streamerName: process.env.STREAMER_NAME,
      platform: process.env.PLATFORM,
    });
  });

  adminApp.get("/animation", function (req, res) {
    res.render("animation");
  });

  app.post(
    "/payment",
    async function (req, res, next) {
      name = escape(req.body.name);
      message = escape(req.body.message);

      subaddress = await generateNewSubaddress(name + " - " + message);

      // QR Code generieren
      const typeNumber = 0;
      const errorCorrectionLevel = "L";
      const qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(await subaddress);
      qr.make();
      const qrcodeURL = qr.createDataURL(6);

      res.render("payment", {
        subaddress: subaddress,
        qrcode: qrcodeURL,
        name: name,
        message: message,
      });

      const checkForPayment = setInterval(
        async () => {
          const payments = await walletRpc.getTransfers({
            IsIncoming: true,
            address: subaddress,
          });

          for (let payment of payments) {
            if (payment.state.address == subaddress) {
              amount = payment.state.amount;
              console.log(
                `Transaction incoming: ${(await amount) / Math.pow(10, 12)} XMR from: ${subaddress}`
              );
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
      io.emit("payment_recieved", amount / Math.pow(10, 12), name);

      // Generate Animation for OBS
      io2.emit("new_donation", amount / Math.pow(10, 12), name, message);

      // Confirmations
      let confirmations_old = 0;
      const checkConfirmations = setInterval(
        async () => {
          const payments = await walletRpc.getTransfers({
            IsIncoming: true,
            address: subaddress,
          });

          for (const payment of payments) {
            if (payment.state.address == subaddress) {
              const confirmations_new = await payment.state.tx.state
                .numConfirmations;
              if (confirmations_new > confirmations_old) {
                confirmations_old = confirmations_new;
                console.log("New confirmation:", confirmations_new);
                io.emit("confirmations", confirmations_new);
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

mainFunction();
