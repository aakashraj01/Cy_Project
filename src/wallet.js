const {Command, flags} = require('@oclif/command');
const bip39 = require('bip39');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const apiKey = process.env.API_KEY;
const getblockUrl = 'https://testnet.block.io/';


class WalletCommand extends Command {
    
    constructor(argv, config) {
        super(argv, config);
        if (!fs.existsSync('./wallets')) {
        fs.mkdirSync('./wallets');
      }
    }

    saveWallet(wallet) {
        const walletName = wallet.name;
        const walletData = JSON.stringify(wallet);
        fs.writeFileSync(`./wallets/${walletName}.json`, walletData);
    }
      
    getWallets() {
        const files = fs.readdirSync('./wallets/');
        const wallets = files.map((file) => {
          const walletData = fs.readFileSync(`./wallets/${file}`);
          return JSON.parse(walletData);
        });
        return wallets;
    }

    async createWallet(name) {
        // Generate a new BIP39 mnemonic

        const mnemonic = bip39.generateMnemonic();
        console.log(`Your BIP39 mnemonic is: ${mnemonic}`);

        // Use the mnemonic to generate a seed buffer
        const seedBuffer = await bip39.mnemonicToSeed(mnemonic);

        // Use the seed buffer to generate a master HDNode
        const masterHDNode = bitcoin.HDNode.fromSeedBuffer(seedBuffer);

        // Derive the first child HDNode from the master HDNode
        const accountHDNode = masterHDNode.derivePath("m/44'/0'/0'");

        // Store the wallet locally, with the given name
        // (You would need to implement this storage step)
        //storeWallet(name, {mnemonic, seedBuffer, masterHDNode, accountHDNode});
        this.saveWallet({name:name, mnemonic:mnemonic, seedBuffer:seedBuffer, masterHDNode:masterHDNode, accountHDNode:accountHDNode, address: accountHDNode.getAddress()});
    }

    async importWallet(name, mnemonic) {
        // Use the mnemonic to generate a seed buffer
        const seedBuffer = await bip39.mnemonicToSeed(mnemonic);

        // Use the seed buffer to generate a master HDNode
        const masterHDNode = bitcoin.HDNode.fromSeedBuffer(seedBuffer);

        // Derive the first child HDNode from the master HDNode
        const accountHDNode = masterHDNode.derivePath("m/44'/0'/0'");

        // Store the wallet locally, with the given name
        // (You would need to implement this storage step)
        //storeWallet(name, {mnemonic, seedBuffer, masterHDNode, accountHDNode});
        this.saveWallet({name:name, mnemonic:mnemonic, seedBuffer:seedBuffer, masterHDNode:masterHDNode, accountHDNode:accountHDNode, address: accountHDNode.getAddress()});
    }

    async listWallets() {
        const wallets = this.getWallets();
        if(wallets.length === 0){
          console.log("No wallet found!");
          return
        }
        console.log("Listing all wallets: ");
        wallets.forEach((wallet,index) => {
          console.log(`${index+1}. Wallet name: ${wallet.name} , Wallet address: ${wallet.address}`);
        });
    }

    async getBalance(address) {
        try {
            const url = `${getblockUrl}/api/v2/get_address_balance/?api_key=${apiKey}&addresses=${address}`;
            const response = await axios.get(url);
            console.log(`Balance for address ${address}: ${response.data.data.available_balance} satoshis`);
        } catch (error) {
            console.log(`Error getting balance for address ${address}: ${error.response.data}`);
        }
    }
    async getTransactions(address) {
        try {
            const url = `${getblockUrl}/api/v2/get_transactions/?api_key=${apiKey}&type=sent&addresses=${address}`;
            const response = await axios.get(url);
            console.log(`Transactions for address ${address}:`);
            response.data.data.txs.forEach((tx) => {
                console.log(`- Hash: ${tx.txid}, Amount: ${tx.amounts_received[0].amount} satoshis, Timestamp: ${tx.time}`);
            });
        } catch (error) {
            console.log(`Error getting transactions for address ${address}: ${error.response.data}`);
        }
    }

    async generateAddress(walletName) {
        // Retrieve the stored wallet from local storage
        // (You would need to implement this storage step)
        // const wallet = getWallet(walletName);
        // if (!wallet) {
        //     console.log(`Error: Wallet "${walletName}" not found`);
        //     return;
        // }

        // Derive the first child HDNode from the master HDNode
        const accountHDNode = wallet.accountHDNode;

        // Derive the first unused child HDNode
        let index = 0;
        let childHDNode = accountHDNode.derive(index);
        while (isAddressUsed(childHDNode.getAddress())) {
            index++;
            childHDNode = accountHDNode.derive(index);
        }

        // Print the unused address
        console.log(`Unused address for ${walletName}: ${childHDNode.getAddress()}`);
    }

    async run() {
        const {flags} = this.parse(WalletCommand);
        if (flags.create) {
            await this.createWallet(flags.create);
        } else if (flags.import) {
            await this.importWallet(flags.import, flags.mnemonic);
        } else if (flags.list) {
            await this.listWallets();
        } else if (flags.balance) {
            await this.getBalance(flags.balance);
        } else if (flags.transactions) {
            await this.getTransactions(flags.transactions);
        } else if (flags.address) {
            await this.generateAddress(flags.address);
        } else {
            console.log('Please specify a flag: --create, --import, --list, --balance, --transactions, --address');
        }
    }
}



WalletCommand.flags = {
    create: flags.string({char: 'c', description: 'Create a new wallet with the given name'}),
    import: flags.string({char: 'i', description: 'Import a wallet with the given name and BIP39 mnemonic'}),
    mnemonic: flags.string({description: 'The BIP39 mnemonic for the imported wallet'}),
    list: flags.boolean({char: 'l', description: 'List all stored wallets'}),
    balance: flags.string({char: 'b', description: 'Get the balance for the given bitcoin address'}),
    transactions: flags.string({char: 't', description: 'Get the transactions for the given bitcoin address'}),
    address: flags.string({char: 'a', description: 'Generate an unused bitcoin address for the given wallet'}),
    };
    
module.exports = WalletCommand;

