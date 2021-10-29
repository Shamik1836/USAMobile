const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintFeeInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
let burnReturnTotalInUSDCShouldBeNowGlobalV;
let burnFeeInUSDCShouldBeNowGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintFeeInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
let burnReturnTotalInUSDCWasPaidNowGlobalV;
let burnFeeInUSDCWasPaidNowGlobalV;

let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let totalSpent = 0;
let totalReturned = 0;
let totalUSDCcentsInTestAcc = 0;

let totalUSDCcentsEntriesArr = [];

const scale6dec = 1000000;

const baseFee = 1;
const levelAntesArray =     [ 0, 20, 60, 100, 500, 2000];      // TODO: check if can/should be used
const levelDiscountsArray = [ 0, 5,  10,  20,  40,   75];  // TODO: check if can/should be used

let benjaminsContract;

const polygonMATICaddress = '0x0000000000000000000000000000000000001010';

let polygonUSDC;
const polygonUSDCaddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let polygonLendingPool;
const polygonLendingPoolAddress = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

let quickswapFactory;
const quickswapFactoryAddress = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';

let polygonETH;
const polygonWETHaddress = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';

let polygonWMATIC;
const polygonWMATICaddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

let whaleSignerAddress;

let testUserAddressesArray = [];

let testUser_0_Signer;
let testUser_1_Signer;
let testUser_2_Signer;
let testUser_3_Signer;
let testUser_4_Signer;
let testUser_5_Signer;
let testUser_6_Signer;
let testUser_7_Signer;
let testUser_8_Signer;
let testUser_9_Signer;

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

// helper function to console.log for testing/debugging: looking up the accounts[] variable for an address 
function findUsernameForAddress(addressToLookup){
    for (let findInd = 0; findInd < testUserAddressesArray.length; findInd++) {
      if (testUserAddressesArray[findInd] == addressToLookup) {
        return "testUser_" +`${findInd}`;
      } else if (addressToLookup == '0x0000000000000000000000000000000000000000' ) {
        return "Zero address: 0x0000000000000000000000000000000000000000"      
      }  else if (addressToLookup == '0xE51c8401fe1E70f78BBD3AC660692597D33dbaFF' ) {
        return "feeReceiver"      
      }  else if (addressToLookup == '0xCE74Ae6D4C53E1cC118Bd2549295Bc4e27923DA0' ) {
        return "deployer"      
      }   
    }  
  }; 

// querrying and saving account level and account discount info for userToCheck, and saving them to an array for later confirmation
async function addUserAccDataPoints(userToCheck){
  const userLevelNow = bigNumberToNumber (await benjaminsContract.discountLevel(userToCheck));
  const userDiscountNow = 100 - bigNumberToNumber( await benjaminsContract.quoteFeePercentage(userToCheck)/100); 
  
  if (userToCheck == testUser_1){
    user1LevelDataArray.push(userLevelNow);
    user1DiscountDataArray.push(userDiscountNow);
  } else if (userToCheck == testUser_2) {
    user2LevelDataArray.push(userLevelNow);
    user2DiscountDataArray.push(userDiscountNow);

  } else {
   //console.log("addUserAccDataPoints: user account not set up for data points!")
  }
}

// confirms account level and account discount as recorded via add addUserAccDataPoints function
function confirmUserDataPoints(userToCheck, expectedUserLevelsArray, expectedUserDiscountArray) {
  if  (userToCheck == testUser_1){
    for (let index = 0; index < user1LevelDataArray.length; index++) {
     //console.log("userToCheck", userToCheck);
     //console.log("index", index);
     //console.log("expectedUserLevelsArray[index]", expectedUserLevelsArray[index]);
     //console.log("user1LevelDataArray[index]", user1LevelDataArray[index]);

     //console.log("expectedUserDiscountArray[index]", expectedUserDiscountArray[index]);
     //console.log("user1DiscountDataArray[index]", user1DiscountDataArray[index]);
      expect(user1LevelDataArray[index]).to.equal(expectedUserLevelsArray[index]); 
      expect(user1DiscountDataArray[index]).to.equal(expectedUserDiscountArray[index]);
    }
  } else if (userToCheck == testUser_2) {

    for (let index = 0; index < user2LevelDataArray.length; index++) {
      expect(user2LevelDataArray[index]).to.equal(expectedUserLevelsArray[index]); 
      expect(user2DiscountDataArray[index]).to.equal(expectedUserDiscountArray[index]);
    }
  }
  // resetting for next test
  user1LevelDataArray = [];
  user1DiscountDataArray = [];
  user2LevelDataArray = [];
  user2DiscountDataArray = [];
  
}

// simulate the passing of blocks
async function mintBlocks (amountOfBlocksToMint) {
  for (let i = 0; i < amountOfBlocksToMint; i++) {
    await ethers.provider.send("evm_mine");
  }
}

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

async function balUSDCinCents(userToQuery) {
  return dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(userToQuery)));
}

async function balUSDC(userToQuery) {
  return (await balUSDCinCents(userToQuery)/100);
}

async function balUSDCin6decBN(userToQuery) {
  return await polygonUSDC.balanceOf(userToQuery);
}

async function balBNJI(userToQuery) {
  return bigNumberToNumber (await benjaminsContract.balanceOf(userToQuery));
}

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = Number ((ethers.utils.formatUnits(bignumber, 0)).toString());  
  return convertedNumber;
}

// converting from 6dec to USDC
function divideFrom6decToUSDC (largeNumber) {
  const numberInUSDC = Number( largeNumber / (10**6) );      
  return numberInUSDC;    
}

// converting from 6dec to USDC cents
function dividefrom6decToUSDCcents (largeNumber) {
  const numberInUSDC = Number( largeNumber / (10**4) );      
  return numberInUSDC;    
}

// converting from USDC to 6dec
function multiplyFromUSDCto6dec (smallNumber) {
  const numberInUSDC = Number( smallNumber * (10**6) );      
  return numberInUSDC;    
}

// converting from USDC cents to 6dec 
function multiplyFromUSDCcentsTo6dec (smallNumber) {
  const numberInUSDC = Number( smallNumber * (10**4) );      
  return numberInUSDC;    
}

// converting cents to USDC
function fromCentsToUSDC (numberInCents) {
  const numberInUSDC = numberInCents /100;      
  return numberInUSDC;    
}

// converting USDC to cents
function fromUSDCToCents (numberInUSDC) {
  const numberInCents = numberInUSDC *100;      
  return numberInCents;    
}

async function getMaticBalance(adress) {    
  const balanceInWEI = await ethers.provider.getBalance(adress); 
  const balanceInMATIC = Number(balanceInWEI / (10**18) );        
  return balanceInMATIC;
}

function decipherBlockFeedback(blockResponseObject) {
 //console.log("User is holding his BNJI this many blocks so far:", bigNumberToNumber( blockResponseObject.blocksHoldingSoFar));
 //console.log("This many blocks are needed for user to unlock:", bigNumberToNumber( blockResponseObject.blocksNecessaryTotal));
}

function getRoundedFee(userLevel, principalInUSDCcents){    
  const feeModifier = (100 * baseFee * (100-levelDiscountsArray[userLevel])) /10000;
  const feeStarterInCents = ((principalInUSDCcents * feeModifier ) /100);   
  const feeInCentsRoundedDown = feeStarterInCents - (feeStarterInCents % 1);
  return feeInCentsRoundedDown  
}

async function testTransfer(amountBNJIsToTransfer, callingAccAddress, receivingAddress){
  console.log(callingAccAddress, 'callingAccAddress in testTransfer');
  console.log(amountBNJIsToTransfer, 'amountBNJIsToTransfer in testTransfer');
  console.log(receivingAddress, 'receivingAddress in testTransfer');
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(callingAccAddress)); 
  console.log(userLevel, 'userLevel in testTransfer');

  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  const feeInCentsRoundedDown = await calcBurnVariables(amountBNJIsToTransfer, callingAccAddress, true);  
  console.log(feeInCentsRoundedDown, 'feeInCentsRoundedDown to be approved in testTransfer');    
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, multiplyFromUSDCcentsTo6dec(feeInCentsRoundedDown));
  // calling transfer function on benjaminscontract  
  await benjaminsContract.connect(callingAccSigner).transfer(receivingAddress, amountBNJIsToTransfer);
}

async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

  const callingAccountName = findUsernameForAddress(callingAccAddress);  
  console.log('calling address in testMinting is now:', callingAccountName, callingAccAddress);  
  const receivingAccountName = findUsernameForAddress(receivingAddress);  
  
  const totalSupplyBeforeMint = bigNumberToNumber( await benjaminsContract.totalSupply()); 
  
  const receivingAddressBNJIbalBeforeMint = await balBNJI(receivingAddress);
  const contractBNJIbalBefore = await balBNJI(benjaminsContract.address); 
  
  const callingAccUSDCBalanceBeforeMintInCents = await balUSDCinCents(callingAccAddress);  
  const feeReceiverUSDCBalanceBeforeMintInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceBeforeMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  
  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  
  const restAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  expect(await restAllowanceToBNJIcontractIn6dec).to.equal(0);
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint, callingAccAddress);  // pausing issue is here TODO:fix
  console.log(bigNumberToNumber(amountToApproveIn6dec), 'amountToApproveIn6dec in testMinting', );  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);
  
  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  //console.log(bigNumberToNumber(givenAllowanceToBNJIcontractIn6dec), `givenAllowanceToBNJIcontract in testMinting by ${callingAccAddress}` ); 

  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
  
  console.log(`${callingAccountName} is minting this many tokens:`, amountToMint, 'for:', receivingAccountName );
  
  // descr: function mintTo(uint256 _amount, address _toWhom) public whenAvailable {  
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  console.log("MINTING HAPPENED ======= == = = == = = = = = = == = = =" );

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAddressBNJIbalAfterMint = await balBNJI(receivingAddress);
  const contractBNJIbalAfter = await balBNJI(benjaminsContract.address); 

  const callingAccUSDCBalanceAfterMintInCents = await balUSDCinCents(callingAccAddress);   
  const feeReceiverUSDCBalanceAfterMintInCents = await balUSDCinCents(feeReceiver); 

  const contractAMUSDCbalanceAfterMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));  

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  const contractAMUSDCdiffMintInCents = contractAMUSDCbalanceAfterMintInCents - contractAMUSDCbalanceBeforeMintInCents;
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeMintInCents), `benjaminsContract amUSDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterMintInCents), `benjaminsContract amUSDC balance after ${mintName}`);

  console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents), `${receivingAccountName} USDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents), `${receivingAccountName} USDC balance after ${mintName}`);    

  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeMintInCents), `feeReceiver USDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterMintInCents), `feeReceiver USDC balance after ${mintName}`);
  
  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents), `${receivingAccountName} mint price paid in USDC`);
 //console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `approx. of what benjaminsContract received in amUSDC (incl. interest already accrued)`);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver mint fee received in USDC:`);  
 //console.log(fromCentsToUSDC(callingAccMintPricePaidInCents - contractAMUSDCdiffMintInCents), `approx. of what should be the fee received, in USDC (difference between paid by user and received by protocol, changed by interest already accrued)`); 

  console.log(totalSupplyBeforeMint, `Benjamins total supply before minting ${amountToMint} Benjamins`); 
  console.log(totalSupplyAfterMint, `Benjamins total supply after minting ${amountToMint} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${mintName}`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${mintName}`);

  console.log(receivingAddressBNJIbalBeforeMint, `receivingAddress owns/manages this many benjamins before ${mintName}`);
  console.log(receivingAddressBNJIbalAfterMint, `receivingAddress owns/manages this many benjamins after ${mintName}`);

  
  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  mintFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();

  console.log(`==============================================================================`);
  console.log(`==============================================================================`);

};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) { 

  const callingAccountName = findUsernameForAddress(callingAccAddress);
  console.log('calling address in testBurning is now:', callingAccountName, callingAccAddress);
  const receivingAccountName = findUsernameForAddress(receivingAddress);  

  const totalSupplyBeforeBurn = bigNumberToNumber( await benjaminsContract.totalSupply() );

  const callingAddressBNJIbalBeforeBurn = await balBNJI(callingAccAddress);
  const contractBNJIbalBefore = await balBNJI(benjaminsContract.address); 

  const receivingAddressUSDCBalanceBeforeBurnInCents = await balUSDCinCents(receivingAddress); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceBeforeBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn, callingAccAddress);

  // descr: function burnTo(uint256 _amount, address _toWhom)
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);  
  
  console.log(`${callingAccountName} is burning this many tokens:`, amountToBurn, 'for:', receivingAccountName );

  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAccUSDCBalanceAfterBurnInCents = await balUSDCinCents(receivingAddress); 
  
  
  const callingAccBNJIbalAfter = await balBNJI(callingAccAddress); 
  const feeReceiverUSDCBalanceAfterBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceAfterBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  
  const contractBNJIbalAfter = await balBNJI(benjaminsContract.address); 

  const receivingAccBurnReturnReceivedInCents = receivingAccUSDCBalanceAfterBurnInCents - receivingAddressUSDCBalanceBeforeBurnInCents;
  const contractAMUSDCdiffBurnInCents = contractAMUSDCbalanceBeforeBurnInCents - contractAMUSDCbalanceAfterBurnInCents ;
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;     
  
  //const burningAccBNJIdifference = callingAddressBNJIbalBeforeBurn - callingAccBNJIbalAfter;
  
 //console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeBurnInCents), `benjaminsContract amUSDC balance before ${burnName}`);
 //console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterBurnInCents), `benjaminsContract amUSDC balance after ${burnName}`);

 //console.log(fromCentsToUSDC(callingAddressBNJIbalBeforeBurn), `${callingAccountName} BNJI balance before ${burnName}`);
 //console.log(fromCentsToUSDC(callingAccBNJIbalAfter), `${callingAccountName} BNJI balance after ${burnName}`);    

 //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeBurnInCents), `feeReceiver USDC balance before ${burnName}`);
 //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterBurnInCents), `feeReceiver USDC balance after ${burnName}`);
  
 //console.log(fromCentsToUSDC(receivingAccBurnReturnReceivedInCents), `${callingAccountName} burn return received in USDC`);
 //console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents), `approx. of what benjaminsContract paid out in amUSDC (incl. interest already accrued) `);

 //console.log(fromCentsToUSDC(feeReceiverUSDCdiffBurnInCents), `feeReceiver burn fee received in USDC:`);  
 //console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents - receivingAccBurnReturnReceivedInCents), `approx. of what should be the fee received, in USDC (difference between received by user and paid by protocol, changed by interest already accrued)`); 

 //console.log(totalSupplyBeforeBurn, `Benjamins total supply before burning ${amountToBurn} Benjamins`); 
 //console.log(totalSupplyAfterBurn, `Benjamins total supply after burning ${amountToBurn} Benjamins`); 

 //console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${burnName}`);
 //console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${burnName}`);
  
 //console.log(`Benjamin total supply after, burning ${amountToBurn} tokens:`, totalSupplyAfterBurn); 

  burnReturnTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(receivingAccBurnReturnReceivedInCents);
  burnFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffBurnInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  confirmBurn();

 //console.log(`==============================================================================`);
 //console.log(`==============================================================================`);

};

function resetTrackers(){
  tokensShouldExistNowGlobalV = 0;
  mintPriceTotalInUSDCShouldBeNowGlobalV = 0; 
  mintFeeInUSDCShouldBeNowGlobalV = 0; 

  mintAllowanceInUSDCCentsShouldBeNowGlobalV = 0;
  burnReturnTotalInUSDCShouldBeNowGlobalV = 0;
  burnFeeInUSDCShouldBeNowGlobalV = 0;

  tokensExistQueriedGlobalV = 0;
  mintPriceTotalInUSDCWasPaidNowGlobalV = 0;
  mintFeeInUSDCWasPaidNowGlobalV = 0;

  mintAllowanceInUSDCCentsWasNowGlobalV = 0;
  burnReturnTotalInUSDCWasPaidNowGlobalV = 0;
  burnFeeInUSDCWasPaidNowGlobalV = 0;
} 

function confirmMint(){  
  console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmMint');
  console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmMint');
  
  console.log(mintPriceTotalInUSDCShouldBeNowGlobalV, 'mintPriceTotalInUSDCShouldBeNowGlobalV, confirmMint');
  console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmMint');

  console.log(mintFeeInUSDCShouldBeNowGlobalV, 'mintFeeInUSDCShouldBeNowGlobalV, confirmMint');
  console.log(mintFeeInUSDCWasPaidNowGlobalV, 'mintFeeInUSDCWasPaidNowGlobalV, confirmMint');

  console.log(mintAllowanceInUSDCCentsShouldBeNowGlobalV, 'mintAllowanceInUSDCCentsShouldBeNowGlobalV, confirmMint');
  console.log(mintAllowanceInUSDCCentsWasNowGlobalV, 'mintAllowanceInUSDCCentsWasNowGlobalV, confirmMint');

  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintFeeInUSDCShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
  
};

function confirmBurn(){  
  console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmBurn');
  console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmBurn');
  
  console.log(burnReturnTotalInUSDCShouldBeNowGlobalV, 'burnReturnTotalInUSDCShouldBeNowGlobalV, confirmBurn');
  console.log(burnReturnTotalInUSDCWasPaidNowGlobalV, 'burnReturnTotalInUSDCWasPaidNowGlobalV, confirmBurn');
  
  console.log(burnFeeInUSDCShouldBeNowGlobalV, 'burnFeeInUSDCShouldBeNowGlobalV, confirmBurn');
  console.log(burnFeeInUSDCWasPaidNowGlobalV, 'burnFeeInUSDCWasPaidNowGlobalV, confirmBurn');

  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  expect(burnReturnTotalInUSDCShouldBeNowGlobalV).to.equal(Number(burnReturnTotalInUSDCWasPaidNowGlobalV));
  expect(burnFeeInUSDCShouldBeNowGlobalV).to.equal(Number(burnFeeInUSDCWasPaidNowGlobalV));
};

async function calcMintApprovalAndPrep(amountToMint, accountMinting) {  
  
  const amountOfTokensBeforeMint = bigNumberToNumber(await benjaminsContract.totalSupply());
  const amountOfTokensAfterMint = Number (amountOfTokensBeforeMint) + Number (amountToMint);  

  const usersTokenAtStart = await balBNJI(accountMinting);
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountMinting)); // TODO: fix, pausing issue is in this call
  
  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 800000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostRoundedDownInCents = mintingCostInCents - (mintingCostInCents % 1);

  const mintFeeInCentsRoundedDown = getRoundedFee(userLevel, mintingCostRoundedDownInCents);  
  console.log(mintFeeInCentsRoundedDown, "mintFeeInCentsRoundedDown, calcMintApprovalAndPrep"); 

  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostRoundedDownInCents + mintFeeInCentsRoundedDown;
  const toPayTotalInUSDC = toPayTotalInCents / 100;
  const toPayTotalIn6dec = toPayTotalInCents * 10000;    

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCShouldBeNowGlobalV = toPayTotalInUSDC;
  mintFeeInUSDCShouldBeNowGlobalV = mintFeeInCentsRoundedDown/100;
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = toPayTotalInCents;  

 //console.log(usersTokenAtStart, "this was the users token balance at start, calcMintApprovalAndPrep");  
 //console.log(userLevel, "this was the users applied account level, calcMintApprovalAndPrep");
 //console.log(feeModifier, "this was the fee modifier in percent, calcMintApprovalAndPrep");

  return toPayTotalIn6dec;
}

async function calcBurnVariables(amountToBurn, accountBurning, isTransfer=false) {

  const amountOfTokensBeforeBurn = bigNumberToNumber(await benjaminsContract.totalSupply());  
  const amountOfTokensAfterBurn = amountOfTokensBeforeBurn - amountToBurn;

  const usersTokenAtStart = await balBNJI(accountBurning);
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountBurning)); 
  
  
  const burnReturnInUSDC = ( (amountOfTokensBeforeBurn * amountOfTokensBeforeBurn) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 800000;
  const burnReturnInCents = burnReturnInUSDC * 100;
  const burnReturnRoundedDownInCents = burnReturnInCents - (burnReturnInCents % 1);  
  
  const burnFeeInCentsRoundedDown = getRoundedFee(userLevel, burnReturnRoundedDownInCents); 

  const toReceiveTotalInCents = burnReturnRoundedDownInCents - burnFeeInCentsRoundedDown;
  const toReceiveTotalInUSDC = toReceiveTotalInCents / 100;
  const toReceiveTotalIn6dec = toReceiveTotalInCents * 10000;
  
  if (isTransfer==false){
    tokensShouldExistNowGlobalV = amountOfTokensAfterBurn;
    burnReturnTotalInUSDCShouldBeNowGlobalV = toReceiveTotalInUSDC;
    burnFeeInUSDCShouldBeNowGlobalV = burnFeeInCentsRoundedDown/100;
  } else {
    return burnFeeInCentsRoundedDown;
  }
  //console.log("tokensShouldExistNowGlobalV:", tokensShouldExistNowGlobalV );
  //console.log("burnReturnTotalInUSDCShouldBeNowGlobalV:", burnReturnTotalInUSDCShouldBeNowGlobalV );

  //console.log(usersTokenAtStart, "this is the burning users token balance found at start, calcBurnVariables");  
  //console.log(userLevel, "this is the burning users account level found at start, calcBurnVariables");
  //console.log(feeModifier/100, "this is the applicable fee modifier in percent found at start, calcBurnVariables");  
}

async function getSignersAndStoreAddr(){
  testUser_0_Signer = await ethers.provider.getSigner(testUser_0);
  testUser_1_Signer = await ethers.provider.getSigner(testUser_1); 
  testUser_2_Signer = await ethers.provider.getSigner(testUser_2); 
  testUser_3_Signer = await ethers.provider.getSigner(testUser_3); 
  testUser_4_Signer = await ethers.provider.getSigner(testUser_4); 
  testUser_5_Signer = await ethers.provider.getSigner(testUser_5); 
  testUser_6_Signer = await ethers.provider.getSigner(testUser_6); 
  testUser_7_Signer = await ethers.provider.getSigner(testUser_7); 
  testUser_8_Signer = await ethers.provider.getSigner(testUser_8); 
  testUser_9_Signer = await ethers.provider.getSigner(testUser_9);
    
  testUserAddressesArray.push(testUser_0); 
  testUserAddressesArray.push(testUser_1);   
  testUserAddressesArray.push(testUser_2); 
  testUserAddressesArray.push(testUser_3); 
  testUserAddressesArray.push(testUser_4); 
  testUserAddressesArray.push(testUser_5); 
  testUserAddressesArray.push(testUser_6); 
  testUserAddressesArray.push(testUser_7); 
  testUserAddressesArray.push(testUser_8); 
  testUserAddressesArray.push(testUser_9); 
}

async function checkTestAddresses(amountUSDC, amountMatic, amountBNJI, expectBool){
  for (let index = 0; index < 10; index++) {
    const testUserAddress = testUserAddressesArray[index];      
    console.log(`testUserAddressesArray[${index}] is:`, testUserAddress);
    const callingAccountName = findUsernameForAddress(testUserAddress);
    console.log(`and it's name is:`, callingAccountName);
    const testAccUSDCcentsbal = await balUSDCinCents(testUserAddress);
    console.log(`${callingAccountName} has this many USDC after preparation:`, testAccUSDCcentsbal); 
    const testAccMATICbal = await getMaticBalance(testUserAddress);
    console.log(`${callingAccountName} has this many Matic after preparation:`, testAccMATICbal); 
    const testAccBNJIbal = await balBNJI(testUserAddress);
    console.log(`${callingAccountName} has this many Matic after preparation:`, testAccBNJIbal);   

    // if arg 'expectBool' was sent in as true, verify preparation did work as expected
    if (expectBool == true){
      expect(testAccUSDCcentsbal).to.equal(amountUSDC*100);
      expect(testAccMATICbal).to.equal(amountMatic);
      expect(testAccBNJIbal).to.equal(amountBNJI);
    }  

    // add each account's amount of USDCcents onto the counter
    totalUSDCcentsInTestAcc += testAccUSDCcentsbal;    
  }
  // keep log of all USDCcents found in testaccounts, save each reound of queries to totalUSDCcentsEntriesArr
  totalUSDCcentsEntriesArr.push(totalUSDCcentsInTestAcc);
  console.log('These are the entries each time all USDCcents were counted: ', totalUSDCcentsEntriesArr);
  // reset counter for next round of queries
  totalUSDCcentsInTestAcc = 0;
}

async function runMintOrBurnLoop(loopsToRun) {
  let randomMintOrBurn;
  let mintCounter = 0;
  let burnCounter = 0;

  // running either minting or burning, this many loops: opCounter
  for (opCounter = 1; opCounter <= loopsToRun; opCounter++) {
    // randomizing minting or burning
    randomMintOrBurn = Math.floor (Math.random() * 10);
    console.log('randomMintOrBurn', randomMintOrBurn); 

    const acc5TokenBalanceOperationStart = bigNumberToNumber( await ourTokenContract.balanceOf(accounts[5].address) );
    console.log(`acc5 has this many tokens before operation nr: ${opCounter} :`, acc5TokenBalanceOperationStart); 

    // BURNING
    // if randomMintOrBurn = one of these: = 5,6,7,8, 9, burn.
    // acc5 must have 20k tokens to be able to trigger burning
    if (randomMintOrBurn > 5 && acc5TokenBalanceOperationStart > 20000){
      console.log(`operation nr: ${opCounter} is BURNING`); 
    
      // local function to check burning amount repeatedly until it's okay
      function checkBurningAmountOkay() {

        let rerunCounter = 0;
        if (rerunCounter < 10 && burnReturnTotalInUSDCShouldBeNowGlobalV < 5 || randomAmountBurning > acc5TokenBalanceOperationStart) {

          if (burnReturnTotalInUSDCShouldBeNowGlobalV < 5) {
            console.log(`RERUN, burn call would be under $5`);
            randomAmountBurning = randomAmountBurning + 3000;
            console.log(`RERUN tried to burn few tokens, now trying to burn: `, randomAmountBurning);
          }
          if (randomAmountBurning > acc5TokenBalanceOperationStart){
            console.log(`RERUN, call would be too big for acc5 token balance`)  
            // creating a number lower than 1, multiplying it with tokens user has, i.e. never more than he has. then rounding down to full token
            randomAmountBurning = ( Math.floor (Math.random() * acc5TokenBalanceOperationStart) ) ;
            console.log(`RERUN tried to burn more tokens than he has, now trying to burn: `, randomAmountBurning);
          }            
                      
          calcBurnVariables(tokensExistingBeforeBurn, randomAmountBurning);  // this call will change burnReturnTotalInUSDCShouldBeNowGlobalV, so no endless loop
          checkBurningAmountOkay();
          rerunCounter++;
        } 
      } 

      // randomizing amount to burn
      let randomAmountBurning = Math.floor (Math.random() * 100000);
      console.log('randomAmountBurning', randomAmountBurning);                 
      
      let tokensExistingBeforeBurn = bigNumberToNumber( await ourTokenContract.totalSupply() );        
      
      //calcBurnVariables(nrOfTokensExisting, amountToBurn);         

      calcBurnVariables(tokensExistingBeforeBurn, randomAmountBurning);
      
      checkBurningAmountOkay(); // checking if amount is okay

      console.log(`operation nr: ${opCounter} will BURN this many tokens:`, randomAmountBurning);

      burnCounter++;

      //testBurning(burnName, amountToBurn, callingAcc)
      await testBurning(`operation nr: ${opCounter}, burning`, randomAmountBurning, accounts[5]);

      totalReturned += burnReturnTotalInUSDCWasPaidNowGlobalV;

      // confirmBurn(nrOfTokensExisting, amountToBurn)
      confirmBurn(tokensExistingBeforeBurn, randomAmountBurning); 
    }

    // MINTING
    // if randomMintOrBurn = one of these: 0,1,2,3,4, mint. 
    else {
      console.log(`operation nr: ${opCounter} is MINTING`);

      const acc5MockUSDCBalanceOperationStart = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[5].address)) );
      console.log(`acc5 has this many USDC before operation nr: ${opCounter} :`, acc5MockUSDCBalanceOperationStart);           

      // local function to check minting amount repeatedly until it's okay
      function checkMintingAmountOkay() {
        if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 5000 || (mintAllowanceInUSDCCentsShouldBeNowGlobalV/100) > acc5MockUSDCBalanceOperationStart) {
          if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 5000) {
            console.log(`RERUN, mint call would be under $5`);  
            randomAmountMinting = Math.floor (Math.random() * 100000); 
          }
          if ((mintAllowanceInUSDCCentsShouldBeNowGlobalV/100) > acc5MockUSDCBalanceOperationStart){
            console.log(`RERUN, mint call would be too big for acc5's USDC balance`)  
            randomAmountMinting = 1000; 
          }          
          
          console.log('RERUN randomAmountMinting', randomAmountMinting);
          calcMintVariables(tokensExistingNow, randomAmountMinting);  // this call will change mintAllowanceInUSDCCentsShouldBeNowGlobalV, so no endless loop
          checkMintingAmountOkay();         
        } 
      }

      // randomizing amount to mint
      let randomAmountMinting = Math.floor (Math.random() * 100000);
      console.log('randomAmountMinting', randomAmountMinting);         
      
      let tokensExistingNow = bigNumberToNumber( await ourTokenContract.totalSupply() );        
      
      //calcMintVariables(nrOfTokensExisting, amountToMint);
      calcMintVariables(tokensExistingNow, randomAmountMinting);
      
      checkMintingAmountOkay(); // checking if amount is okay

      console.log(`operation nr: ${opCounter} will MINT this many tokens:`, randomAmountMinting);

      mintCounter++;

      //testMinting(mintName, amountToMint, ammountToApproveInCents, callingAcc, nrOfFaucetCalls)
      await testMinting(`operation nr: ${opCounter}, minting`, randomAmountMinting, mintAllowanceInUSDCCentsShouldBeNowGlobalV, accounts[5], 0);

      totalSpent += mintPriceTotalInUSDCWasPaidNowGlobalV;

      //confirmMint(nrOfTokensExisting, amountToMint)
      confirmMint(tokensExistingNow, randomAmountMinting); 

    } 


    
  }

  loopCounterTotal += (opCounter-1);
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;

  

  const protocolBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(ourTokenContract.address)) );
  console.log('protocol our contract USDC balance at the end of all loops so far', protocolBalanceAfterTest);
  const protocolBalanceAfterTestJSExactness = Number(protocolBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);
  
  const acc5MockUSDCBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[5].address)) );
  console.log('acc5 user USDC balance at the end of all loops so far', acc5MockUSDCBalanceAfterTest);
  const acc5MockUSDCBalanceAfterTestJSExactness = Number(acc5MockUSDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const feeReceiveracc1MockUSDCBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[1].address)) );
  console.log('feeReceiver acc1 USDC balance at the end of all loops so far', feeReceiveracc1MockUSDCBalanceAfterTest);
  const feeReceiveracc1MockUSDCBalanceAfterTestJSExactness = Number(feeReceiveracc1MockUSDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const inTotalUSDCExistafterTest = protocolBalanceAfterTestJSExactness + acc5MockUSDCBalanceAfterTestJSExactness + feeReceiveracc1MockUSDCBalanceAfterTestJSExactness ; 
  console.log('JS * 100 check', inTotalUSDCExistafterTest);

  const jsExactnessResolved = inTotalUSDCExistafterTest / 100;
  console.log('in total USDC at the end of all loops so far', jsExactnessResolved);

  const callingAccEndTokenBalance = bigNumberToNumber( await ourTokenContract.balanceOf(accounts[5].address) );
  console.log('at the end of all loops so far, acc 5 has this many tokens:', callingAccEndTokenBalance);

  console.log(`test ran ${loopCounterTotal} loops so far, of which ${mintCounterTotal} were mints and ${burnCounterTotal} were burns`); 
  console.log(`so far, ${totalSpent} USDC were spent by acc5 and ${totalReturned} USDC were paid out by the contract in total`); 


} 

describe("Benjamins Test", function () {

  // setting instances of contracts
  before(async function() {   

    ({ deployer, 
    feeReceiver, 
    accumulatedReceiver,
    testUser_0,
    testUser_1, 
    testUser_2, 
    testUser_3, 
    testUser_4, 
    testUser_5,
    testUser_6, 
    testUser_7, 
    testUser_8, 
    testUser_9    
    } = await getNamedAccounts());
    
    deployerSigner = await ethers.provider.getSigner(deployer); 

    await getSignersAndStoreAddr();
    //console.log('testUserAddressesArray:', testUserAddressesArray);
    
    // Deploy contract
    await fixture(["Benjamins"]);
    benjaminsContract = await ethers.getContract("Benjamins");      

    polygonUSDC = new ethers.Contract(
      polygonUSDCaddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      deployerSigner
    );

    polygonAmUSDC = new ethers.Contract(
      polygonAmUSDCAddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      deployerSigner
    );  
    
    polygonLendingPool = new ethers.Contract(
      polygonLendingPoolAddress,
      [
        'function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
      ], 
      deployerSigner
    );  
    
    // after deployment, querying benjamins balance of deployer, logging as number and from WEI to ETH
    //const startingBalanceInbenjamins = await balBNJI(deployer);    
    //console.log("deployer owns/controls this many benjamins after deployment: ", startingBalanceInbenjamins);

    // after deployment, querying benjamins total supply
    //const totalSupplyAfterDeploy = bigNumberToNumber(await benjaminsContract.totalSupply()) ;
    //console.log("benjamins total supply after deployment: ", totalSupplyAfterDeploy);   

    /*
    // after deployment, checking allowance between BenjaminsContract and LendingPool
    const contractAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(benjaminsContract.address, polygonLendingPool.address)) ;
    const deployerAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(deployer, polygonLendingPool.address)) ;
   //console.log("contractAllowanceAfterDeploy: ", contractAllowanceAfterDeploy);   
   //console.log("deployerAllowanceAfterDeploy: ", deployerAllowanceAfterDeploy);
    */   

    //console.log("polygonUSDC address: ", polygonUSDC.address);   
    //console.log("polygonLendingPool address: ", polygonLendingPool.address);  
    //console.log("polygonAmUSDC address: ", polygonAmUSDC.address);      

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });

    const whaleSigner = await ethers.getSigner("0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd");

    polygonUSDCWhaleSignedIn = new ethers.Contract(
      polygonUSDCaddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      whaleSigner
    );    

    whaleSignerAddress = whaleSigner.address;
    //console.log('whaleSignerAddress:', whaleSignerAddress);  

    //const whaleMaticBefore = await getMaticBalance(whaleSignerAddress);
    //console.log('whale has this many MATIC before sending whale transfer:', whaleMaticBefore);   

    //const deployerMaticBefore = await getMaticBalance(deployer);
    //console.log('deployer has this many MATIC before getting whale transfer:', deployerMaticBefore);   
      
    await whaleSigner.sendTransaction({
      to: deployer,
      value: ethers.utils.parseEther("5000000") // 5,000,000 Matic
    })

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });    

    //const whaleMaticAfter = await getMaticBalance(whaleSignerAddress);
    //console.log('whale has this many MATIC after sending whale transfer:', whaleMaticAfter); 

    //const deployerMaticAfter = await getMaticBalance(deployer);
    //console.log('deployer has this many MATIC after getting whale transfer:', deployerMaticAfter);     
       
    polygonWMATIC = new ethers.Contract(
      polygonWMATICaddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function deposit() public payable',            
      ], 
      deployerSigner
    );

    //const deployerMaticBeforeWrapping = await getMaticBalance(deployer);
    //console.log('deployer has this many MATIC before wrapping:', deployerMaticBeforeWrapping);     
    
    await polygonWMATIC.deposit( {value: ethers.utils.parseEther("4000000")} );

    //const deployerMaticAfterWrapping = await getMaticBalance(deployer);
    //console.log('deployer has this many MATIC after wrapping:', deployerMaticAfterWrapping);

    polygonQuickswapRouter = new ethers.Contract(
      polygonQuickswapRouterAddress,
      [
       'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',      
       'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)', 
       'function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
       'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)',
       'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',       
      ], 
      deployerSigner
    );

    polygonWETH = new ethers.Contract(
      polygonWETHaddress,
      [
        'function approve(address spender, uint256 amount) external returns (bool)',
        'function allowance(address owner, address spender) external view returns (uint256)',
        'function balanceOf(address account) external view returns (uint256)',
        'function transfer(address recipient, uint256 amount) external returns (bool)',
      ], 
      deployerSigner
    );
    
    //function approve(address spender, uint value) external returns (bool);
    await polygonWMATIC.approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("15000000") );

    //function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)
    const amountToReceiveUSDCIn6dec = 3000000 * (10**6);
    const amountInMaxInWEI = ethers.utils.parseEther("4000000"); //4000000 * (10**18);   
    await polygonQuickswapRouter.swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
   
    //const deployerUSDCbalEnd2 = await balUSDCinCents(deployer);
    //console.log('deployer has this many USDC after using DEX:', deployerUSDCbalEnd2);                   
  
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    await testMinting("First Setup mint for 100k USDC", 282840, deployer, deployer);    
        
    for (let index = 0; index < 10; index++) {
      const testUserAddress = testUserAddressesArray[index];      
       
      await deployerSigner.sendTransaction({
        to: testUserAddress,
        value: ethers.utils.parseEther("10") // 10 Matic
      })

      await polygonUSDC.connect(deployerSigner).transfer(testUserAddress, (20000*scale6dec) );      
          
    } 
    
  })      
  
  
  it("Large amount test:", async function () {    
        
    await checkTestAddresses(20000,10,0, true);

    /*
    await testMinting("Test 1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);      
    expect(await balBNJI(testUser_1)).to.equal(10);*/
    
  });
  

  
}); 
