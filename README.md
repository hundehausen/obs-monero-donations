# Monero Twitch

Accept Monero donations in your twitch or obs live stream. No third parties involved. Your wallet, your webserver, your monero deamon.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

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
node server.js
```

#### Usage

1. start monerod
2. start monero-wallet-cli and generate a new wallet
    ```
    ./monero-wallet-rpc --daemon-address http://localhost:28081 --testnet --rpc-bind-port 28083 --rpc-login user:abc --rpc-ssl disabled --wallet-dir ./
    ```
3. start monero-wallet-rpc 
4. copy .env.example to .env and edit the config file to your needs

## Authors

* **Grischa Daum**

## License

This project is licensed under the AGPL-3.0 - see the [LICENSE](LICENSE) file for details
