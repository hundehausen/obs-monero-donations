# Monero Twitch

Accept Monero donations in your twitch or obs live stream. No third parties involved. Your wallet, your webserver, your monero deamon.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system. Try first on testnet, before using the mainnet.

### Dependencies and libraries used

* monero-javascript
* express
* pug
* socket.io
* qrcode-generator
* body-parser
* bootstrap
* font-awesome
* jquery
* dotenv

### Prerequisites

What things you need to use the software

* [Monero CLI Wallet](https://web.getmonero.org/downloads/#cli)
* [NodeJS](https://nodejs.org/en/)
* [Streamlabs OBS](https://streamlabs.com/)
* Expose the port of your choice to the internet, a reverse proxy might be helpful

### Installing

```
git clone https://github.com/hundehausen/twitch-monero.git
cd twitch-monero
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
5. node server.js
6. now visit http://localhost:3000 to see your donation page, which you should expose to the internet
7. visit http://localhost:4000/animate to see the animation canvas, that you add to Streamlabs OBS under browser source as input

## Authors

* **Grischa Daum**

## License

This project is licensed under the AGPL-3.0 - see the [LICENSE](LICENSE) file for details
