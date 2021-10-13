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

let secret = require ("./secret")

/*
let mnemonic = process.env.MNEMONIC
  ? process.env.MNEMONIC
: "test test test test test test test test test test test test";
*/

module.exports = {
  networks: {
    mumbai: {
      url: secret.url, // CHANGED FOR MUMBAI XXXXX
      accounts: [secret.key] // CHANGED FOR MUMBAI XXXXX
    },
    /*hardhat: {
      // using forked polygon mainnet as default network, peg at blockNumber: 19907815
      forking: {
        live: true,
        saveDeployments: true,
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
        blockNumber: 19907815,
        //accounts: {
        //  mnemonic,
        //},
      },
    },   */ 
  },  
  namedAccounts: {
    deployer: `${process.env.MUMBAI_DEPLOYER_ACC}`,                // CHANGED FOR MUMBAI XXXXX
    feeReceiverAddress: `${process.env.MUMBAI_FEE_RECEIVER_ACC}`,  // CHANGED FOR MUMBAI XXXXX
    testUser_1: `${process.env.TEST_USER_1}`,
    testUser_2: `${process.env.TEST_USER_2}`,
    testUser_3: `${process.env.TEST_USER_3}`,
    testUser_4: `${process.env.TEST_USER_4}`,
    testUser_5: `${process.env.TEST_USER_5}`,    
  },
  gasReporter: {
    currency: "MATIC",
    gasPrice: 50, // in gwei
    enabled: process.env.REPORT_GAS ? true : false,
    //coinmarketcap: process.env.CMC_API_KEY,
    //excludeContracts: ["mocks/"],
  },
  solidity: {
    version: "0.8.9",
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