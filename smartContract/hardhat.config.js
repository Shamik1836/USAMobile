/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-deploy");

require("hardhat-gas-reporter");
require("chai");
//require("@nomiclabs/hardhat-etherscan");
//require("solidity-coverage");

/*
let mnemonic = process.env.MNEMONIC
  ? process.env.MNEMONIC
: "test test test test test test test test test test test test";
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
    feeReceiverAddress: `${process.env.FEE_RECEIVER_ACC}`,
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