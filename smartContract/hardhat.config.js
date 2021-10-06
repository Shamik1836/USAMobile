require("dotenv").config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("hardhat-deploy");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      // using forked polygon mainnet as default network, peg at blockNumber: 19907815
      forking: {
        live: true,
        saveDeployments: true,
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 19907815,
        /*accounts: {
          mnemonic,
        },*/
      },
    },    
  },  
  namedAccounts: {
    deployer: `${process.env.DEPLOYER_ACC}`,    
  },
  gasReporter: {
    currency: "MATIC",
    gasPrice: 50, // in gwei
    enabled: process.env.REPORT_GAS ? true : false,
    //coinmarketcap: process.env.CMC_API_KEY,
    //excludeContracts: ["mocks/"],
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 240000,
  },
}; 
