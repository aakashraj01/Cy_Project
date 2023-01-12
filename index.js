require('@babel/register');
require('@babel/polyfill');

const WalletCommand = require('./src/wallet').WalletCommand;
const walletCommand = new WalletCommand();

(async () => {
    // Creating a new wallet
    await walletCommand.createWallet('My Wallet');

    // Importing an existing wallet
    await walletCommand.importWallet('Imported Wallet', 'mnemonic phrase');

    // Listing all wallets
    await walletCommand.listWallets();
})();