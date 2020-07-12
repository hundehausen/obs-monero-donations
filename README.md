# OBS Monero Donation integration

Accept Monero donations in your OBS live stream. No third parties involved. Your wallet, your webserver, your stream.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system. Try first on testnet, before using the mainnet.

### Demo

![User Input](/demo/user_input.png?raw=true "User Input")
![Waiting for payment](/demo/waiting.png?raw=true "Waiting for payment")
![Confirmations](/demo/confirmations.png?raw=true "Confirmations")

### Dependencies and libraries used

- monero-javascript
- express
- pug
- socket.io
- qrcode-generator
- body-parser
- bootstrap
- font-awesome
- jQuery
- dotenv
- escape-html

### Prerequisites

What things you need to use the software

- [Monero CLI Wallet](https://web.getmonero.org/downloads/#cli)
- [NodeJS](https://nodejs.org/en/)
- [Streamlabs OBS](https://streamlabs.com/)
- Expose the port of your choice to the internet, a reverse proxy might be helpful

### Installing

```
git clone https://github.com/hundehausen/obs-monero-donations.git
cd obs-monero-donations
npm install
cp .env.example .env
```

#### Usage

1. start monerod
2. start monero-wallet-cli and generate a new wallet
3. start monero-wallet-rpc
   ```
   ./monero-wallet-rpc --testnet --rpc-bind-port 28083 --rpc-login user:abc --rpc-ssl disabled --wallet-dir ./
   ```
4. copy .env.example to .env and edit the config file to your needs
   ```
   STREAMER_NAME=hundehausen
   PLATFORM=twitch // choose between twitch and youtube
   PORT_WEBSERVER=3000
   PORT_ADMINSERVER=4000
   WALLET_NAME=testwallet
   WALLET_PASSWORD=abc
   MONERO_WALLET_RPC_URI=http://localhost:28083
   MONERO_WALLET_RPC_USER=user
   MONERO_WALLET_RPC_PASSWORD=abc
   ```
5. node server.js
6. now visit http://localhost:3000 to see your donation page, which you should expose to the internet
7. visit http://localhost:4000/animation to see the animation canvas, that you add to Streamlabs OBS under browser source as input

## Known bugs

- the animation page uses extremly huge font sizes, I could not get it any bigger with Streamlabs OBS. If it had normal sizes of h1 and h3, I could only see some pixels

## Authors

- **Grischa Daum**

## License

This project is licensed under the AGPL-3.0 - see the [LICENSE](LICENSE) file for details
