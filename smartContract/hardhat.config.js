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
    /*
    mumbai: {
      saveDeployments: true,
      url: secret.url, // CHANGED FOR MUMBAI XXXXX
      accounts: [secret.key] // CHANGED FOR MUMBAI XXXXX
    }, 
    */   
    /*hardhat: {
      // using forked MUMBAI TESTNET as default network, peg at blockNumber: 19907815
      forking: {
        live: true,
        saveDeployments: true,
        url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_URL}`,
        blockNumber: 20182000,
        //accounts: {
        //  mnemonic,
        //},
      },
    },*/
    hardhat: {
      // using forked POLYGON MAINNET as default network, peg at blockNumber: 19907815
      forking: {
        live: true,
        saveDeployments: true,
        url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_URL}`,
        blockNumber: 19907815,
        //accounts: {
        //  mnemonic,
        //},
      },      
    },          
  },  
  namedAccounts: {
    deployer: `${process.env.DEPLOYER_ACC}`,               
    feeReceiverAddress: `${process.env.FEE_RECEIVER_ACC}`,  // CHANGED FOR MUMBAI XXXXX
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
    version: "0.8.0",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  /*
  etherscan: {
    apiKey: secret.Polygon_APIKEY, 
  },
  */
  mocha: {
    timeout: 240000,
  },
}; 