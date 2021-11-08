const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintFeeInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
let burnReturnWOfeeInUSDCShouldBeNowGlobalV;
let burnFeeInUSDCShouldBeNowGlobalV;
let transferFeeShouldBeNowInUSDCcentsGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintFeeInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
let burnReturnWOfeeInUSDCWasPaidNowGlobalV;
let burnFeeInUSDCWasPaidNowGlobalV;
let transferFeeWasPaidNowInUSDCcentsGlobalV;

const scale6dec = 1000000;

let testingUserAddressesArray = [];

const baseFee = 2;
const levelAntesArray =     [ 0, 20, 60, 100, 500, 2000];       // TODO: check if can/should be used
const levelDiscountsArray = [ 0,  5, 10,  20,  40,   75];       // TODO: check if can/should be used


let benjaminsContract;

let polygonUSDC;
const polygonUSDCaddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

const polygonWETHaddress = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';

let polygonWMATIC;
const polygonWMATICaddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

let whaleSignerAddress;

let testUser_1_Signer;
let testUser_2_Signer;

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

// querrying and saving account level and account discount info for userToCheck, and saving them to an array for later confirmation
async function addUserAccDataPoints(userToCheck){
  //console.log(userToCheck, "userToCheck <==============") ;
  const userLevelNow = bigNumberToNumber (await benjaminsContract.discountLevel(userToCheck));
  //console.log(userLevelNow, "userLevelNow <==============") ;

  // in solidity: return 100*baseFee*uint16(100-levelDiscounts[discountLevel(forWhom)]);
  const userDiscountNow = 100 - bigNumberToNumber( await benjaminsContract.quoteFeePercentage(userToCheck)/100/baseFee);
  //console.log(userDiscountNow, "userDiscountNow <==============") ;
  
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
  //console.log(callingAccAddress, 'callingAccAddress in testTransfer');
  //console.log(amountBNJIsToTransfer, 'amountBNJIsToTransfer in testTransfer');
  //console.log(receivingAddress, 'receivingAddress in testTransfer');
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(callingAccAddress)); 
  //console.log(userLevel, 'userLevel in testTransfer');

  const feeReceiverUSDCBalanceBeforeTransferIn6dec = await balUSDCin6decBN(feeReceiver);

  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  const feeInCentsRoundedDown = await calcBurnVariables(amountBNJIsToTransfer, callingAccAddress, true);  
  //console.log(feeInCentsRoundedDown, 'feeInCentsRoundedDown to be approved in testTransfer');    
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, multiplyFromUSDCcentsTo6dec(feeInCentsRoundedDown));
  // calling transfer function on benjaminscontract  
  await benjaminsContract.connect(callingAccSigner).transfer(receivingAddress, amountBNJIsToTransfer);

  const feeReceiverUSDCBalancAfterTransferIn6dec = await balUSDCin6decBN(feeReceiver);

  transferFeeWasPaidNowInUSDCcentsGlobalV = dividefrom6decToUSDCcents(bigNumberToNumber(feeReceiverUSDCBalancAfterTransferIn6dec - feeReceiverUSDCBalanceBeforeTransferIn6dec));

  expect(transferFeeShouldBeNowInUSDCcentsGlobalV).to.equal( Number (transferFeeWasPaidNowInUSDCcentsGlobalV)); 
}

async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

 //console.log('calling address in testMinting is now:', callingAccAddress);
  
  
  const totalSupplyBeforeMint = bigNumberToNumber( await benjaminsContract.totalSupply()); 
  
  const receivingAddressBNJIbalBeforeMint = await balBNJI(receivingAddress);
  const contractBNJIbalBefore = await balBNJI(benjaminsContract.address); 
  
  const callingAccUSDCBalanceBeforeMintInCents = await balUSDCinCents(callingAccAddress);  
  const feeReceiverUSDCBalanceBeforeMintInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceBeforeMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  
  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  
  const restAllowanceToBNJIcontractIn6dec = await polygonUSDC.allowance(callingAccAddress, benjaminsContract.address);
  expect(await restAllowanceToBNJIcontractIn6dec).to.equal(0);
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint, callingAccAddress);  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);
  
  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  //console.log(bigNumberToNumber(givenAllowanceToBNJIcontractIn6dec), `givenAllowanceToBNJIcontract in testMinting by ${callingAccAddress}` ); 

  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
  
  //console.log(`${callingAccAddress} is minting this many tokens:`, amountToMint, 'for:', receivingAddress );
  
  // descr: function mintTo(uint256 _amount, address _toWhom) public whenAvailable {  
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  //console.log("MINTING HAPPENED ======= == = = == = = = = = = == = = =" );

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAddressBNJIbalAfterMint = await balBNJI(receivingAddress);
  const contractBNJIbalAfter = await balBNJI(benjaminsContract.address); 

  const callingAccUSDCBalanceAfterMintInCents = await balUSDCinCents(callingAccAddress);   
  const feeReceiverUSDCBalanceAfterMintInCents = await balUSDCinCents(feeReceiver); 

  const contractAMUSDCbalanceAfterMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));  

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  const contractAMUSDCdiffMintInCents = contractAMUSDCbalanceAfterMintInCents - contractAMUSDCbalanceBeforeMintInCents;
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  //console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeMintInCents), `benjaminsContract amUSDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterMintInCents), `benjaminsContract amUSDC balance after ${mintName}`);

  //console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents), `${callingAccAddress} USDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents), `${callingAccAddress} USDC balance after ${mintName}`);    

  //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeMintInCents), `feeReceiver USDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterMintInCents), `feeReceiver USDC balance after ${mintName}`);
  
  //console.log(fromCentsToUSDC(callingAccMintPricePaidInCents), `${callingAccAddress} mint price paid in USDC`);
 //console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `approx. of what benjaminsContract received in amUSDC (incl. interest already accrued)`);

  //console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver mint fee received in USDC:`);  
 //console.log(fromCentsToUSDC(callingAccMintPricePaidInCents - contractAMUSDCdiffMintInCents), `approx. of what should be the fee received, in USDC (difference between paid by user and received by protocol, changed by interest already accrued)`); 

  //console.log(totalSupplyBeforeMint, `Benjamins total supply before minting ${amountToMint} Benjamins`); 
  //console.log(totalSupplyAfterMint, `Benjamins total supply after minting ${amountToMint} Benjamins`); 

  //console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${mintName}`);
  //console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after${mintName}`);

  //console.log(receivingAddressBNJIbalBeforeMint, `receivingAddress owns/manages this many benjamins before ${mintName}`);
  //console.log(receivingAddressBNJIbalAfterMint, `receivingAddress owns/manages this many benjamins after ${mintName}`);

  
  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  mintFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();

  //console.log(`==============================================================================`);
  //console.log(`==============================================================================`);

};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) { 

 //console.log('calling address in testBurning is now:', callingAccAddress);
 
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
  
 //console.log(`${callingAccAddress} is burning this many tokens:`, amountToBurn, 'for:', receivingAddress );

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

 //console.log(fromCentsToUSDC(callingAddressBNJIbalBeforeBurn), `${callingAccAddress} BNJI balance before ${burnName}`);
 //console.log(fromCentsToUSDC(callingAccBNJIbalAfter), `${callingAccAddress} BNJI balance after ${burnName}`);    

 //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeBurnInCents), `feeReceiver USDC balance before ${burnName}`);
 //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterBurnInCents), `feeReceiver USDC balance after ${burnName}`);
  
 //console.log(fromCentsToUSDC(receivingAccBurnReturnReceivedInCents), `${callingAccAddress} burn return received in USDC`);
 //console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents), `approx. of what benjaminsContract paid out in amUSDC (incl. interest already accrued) `);

 //console.log(fromCentsToUSDC(feeReceiverUSDCdiffBurnInCents), `feeReceiver burn fee received in USDC:`);  
 //console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents - receivingAccBurnReturnReceivedInCents), `approx. of what should be the fee received, in USDC (difference between received by user and paid by protocol, changed by interest already accrued)`); 

 //console.log(totalSupplyBeforeBurn, `Benjamins total supply before burning ${amountToBurn} Benjamins`); 
 //console.log(totalSupplyAfterBurn, `Benjamins total supply after burning ${amountToBurn} Benjamins`); 

 //console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${burnName}`);
 //console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${burnName}`);
  
 //console.log(`Benjamin total supply after, burning ${amountToBurn} tokens:`, totalSupplyAfterBurn); 

  burnReturnWOfeeInUSDCWasPaidNowGlobalV = fromCentsToUSDC(receivingAccBurnReturnReceivedInCents);
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
  burnReturnWOfeeInUSDCShouldBeNowGlobalV = 0;
  burnFeeInUSDCShouldBeNowGlobalV = 0;
  transferFeeShouldBeNowInUSDCcentsGlobalV = 0;

  tokensExistQueriedGlobalV = 0;
  mintPriceTotalInUSDCWasPaidNowGlobalV = 0;
  mintFeeInUSDCWasPaidNowGlobalV = 0;
  mintAllowanceInUSDCCentsWasNowGlobalV = 0;
  burnReturnWOfeeInUSDCWasPaidNowGlobalV = 0;
  burnFeeInUSDCWasPaidNowGlobalV = 0;
  transferFeeWasPaidNowInUSDCcentsGlobalV = 0;

} 

function confirmMint(){  
  //console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmMint');
  //console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmMint');
  
  //console.log(mintPriceTotalInUSDCShouldBeNowGlobalV, 'mintPriceTotalInUSDCShouldBeNowGlobalV, confirmMint');
  //console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmMint');

  //console.log(mintFeeInUSDCShouldBeNowGlobalV, 'mintFeeInUSDCShouldBeNowGlobalV, confirmMint');
  //console.log(mintFeeInUSDCWasPaidNowGlobalV, 'mintFeeInUSDCWasPaidNowGlobalV, confirmMint');

  //console.log(mintAllowanceInUSDCCentsShouldBeNowGlobalV, 'mintAllowanceInUSDCCentsShouldBeNowGlobalV, confirmMint');
  //console.log(mintAllowanceInUSDCCentsWasNowGlobalV, 'mintAllowanceInUSDCCentsWasNowGlobalV, confirmMint');

  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintFeeInUSDCShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
};

function confirmBurn(){  
  //console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmBurn');
  //console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmBurn');
  
  //console.log(burnReturnWOfeeInUSDCShouldBeNowGlobalV, 'burnReturnWOfeeInUSDCShouldBeNowGlobalV, confirmBurn');
  //console.log(burnReturnWOfeeInUSDCWasPaidNowGlobalV, 'burnReturnWOfeeInUSDCWasPaidNowGlobalV, confirmBurn');
  
  //console.log(burnFeeInUSDCShouldBeNowGlobalV, 'burnFeeInUSDCShouldBeNowGlobalV, confirmBurn');
  //console.log(burnFeeInUSDCWasPaidNowGlobalV, 'burnFeeInUSDCWasPaidNowGlobalV, confirmBurn');

  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  expect(burnReturnWOfeeInUSDCShouldBeNowGlobalV).to.equal(Number(burnReturnWOfeeInUSDCWasPaidNowGlobalV));
  expect(burnFeeInUSDCShouldBeNowGlobalV).to.equal(Number(burnFeeInUSDCWasPaidNowGlobalV));
};

async function calcMintApprovalAndPrep(amountToMint, accountMinting) {  
  
  const amountOfTokensBeforeMint = bigNumberToNumber(await benjaminsContract.totalSupply());
  const amountOfTokensAfterMint = Number (amountOfTokensBeforeMint) + Number (amountToMint);  

  const usersTokenAtStart = await balBNJI(accountMinting);
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountMinting)); 

  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 800000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostRoundedDownInCents = mintingCostInCents - (mintingCostInCents % 1);

  const mintFeeInCentsRoundedDown = getRoundedFee(userLevel, mintingCostRoundedDownInCents);  
  //console.log(mintFeeInCentsRoundedDown, "mintFeeInCentsRoundedDown, calcMintApprovalAndPrep"); 

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
    burnReturnWOfeeInUSDCShouldBeNowGlobalV = toReceiveTotalInUSDC;
    burnFeeInUSDCShouldBeNowGlobalV = burnFeeInCentsRoundedDown/100;
  } else {
    transferFeeShouldBeNowInUSDCcentsGlobalV = burnFeeInCentsRoundedDown;
    return burnFeeInCentsRoundedDown;
  }
  //console.log("tokensShouldExistNowGlobalV:", tokensShouldExistNowGlobalV );
  //console.log("burnReturnWOfeeInUSDCShouldBeNowGlobalV:", burnReturnWOfeeInUSDCShouldBeNowGlobalV );

  //console.log(usersTokenAtStart, "this is the burning users token balance found at start, calcBurnVariables");  
  //console.log(userLevel, "this is the burning users account level found at start, calcBurnVariables");
  //console.log(feeModifier/100, "this is the applicable fee modifier in percent found at start, calcBurnVariables");  
}



describe("Benjamins Test", function () {

  // setting instances of contracts
  beforeEach(async function() {   

    ({ deployer, feeReceiver, accumulatedReceiver, testUser_1, testUser_2, testUser_3, testUser_4, testUser_5 } = await getNamedAccounts());

    
    deployerSigner = await ethers.provider.getSigner(deployer);   
    testUser_1_Signer = await ethers.provider.getSigner(testUser_1); 
    testUser_2_Signer = await ethers.provider.getSigner(testUser_2); 

    testingUserAddressesArray.push(testUser_1);
    testingUserAddressesArray.push(testUser_2);
    testingUserAddressesArray.push(testUser_3);
    testingUserAddressesArray.push(testUser_4);
    testingUserAddressesArray.push(testUser_5);    
    
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
    const amountToReceiveUSDCIn6dec = 1000000 * (10**6) //ethers.utils.parseEther("1000000");
    const amountInMaxInWEI = ethers.utils.parseEther("4000000"); //4000000 * (10**18);   
    await polygonQuickswapRouter.swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
   
    //const deployerUSDCbalEnd2 = await balUSDCinCents(deployer);
    //console.log('deployer has this many USDC after using DEX:', deployerUSDCbalEnd2);                   
  
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    await testMinting("First Setup mint for 100k USDC", 282840, deployer, deployer);    
        
    for (let index = 0; index < 2; index++) {
      const testingUser = testingUserAddressesArray[index];

      await deployerSigner.sendTransaction({
        to: testingUser,
        value: ethers.utils.parseEther("10") // 10 Matic
      })

      if (testingUser == testUser_1){
        await polygonUSDC.connect(deployerSigner).transfer(testingUser, (3000*scale6dec) );
      }       
    } 

    //await benjaminsContract.connect(deployerSigner).updateBlocksPerDay(2);

    /*
    const testUser_1_MATICbalance = await getMaticBalance(testUser_1);
    const testUser_1_USDCbalance = await balUSDC(testUser_1);
    const testUser_1_BNJIbalance = await balBNJI(testUser_1) ;

   //console.log('testUser_1 is:', testUser_1);
   //console.log(`testUser_1 has in Matic:`, testUser_1_MATICbalance);
   //console.log(`testUser_1 has in USDC:`, divideFrom6decToUSDC(testUser_1_USDCbalance));   
   //console.log(`testUser_1 has in BNJI:`, testUser_1_BNJIbalance);      

    const testUser_2_MATICbalance = await getMaticBalance(testUser_2);
    const testUser_2_USDCbalance = await balUSDCinCents(testUser_2);
    const testUser_2_BNJIbalance = await balBNJI(testUser_2) ;

   //console.log('testUser_2 is:', testUser_2);
   //console.log(`testUser_2 has in Matic:`, testUser_2_MATICbalance);
   //console.log(`testUser_2 has in USDC:`, testUser_2_USDCbalance/100);   
   //console.log(`testUser_2 has in BNJI:`, testUser_2_BNJIbalance);      
    */
  })      
  
  
  it("Test 1. testUser_1 should mint 10 BNJI for themself", async function () {      
     
    await testMinting("Test 1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);      
    expect(await balBNJI(testUser_1)).to.equal(10);    
    
  });
  
  it("Test 2. testUser_1 should mint 10 BNJI for themself, then do the same again in the next block", async function () { 
        
    await addUserAccDataPoints(testUser_1);        
    await testMinting("Test 2.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);        
    await mintBlocks(1);

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 2.2, minting 10 BNJI to caller", 10, testUser_1, testUser_1);       

    expect(await balBNJI(testUser_1)).to.equal(20);
    await addUserAccDataPoints(testUser_1);    
    
    const expectedUser1Levels = [0,0,1];
    const expectedUser1Discounts = [0,0,5];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });
    
  // took out test 3, can be replaced. Not possible to call function with fractions of tokens as argument
    
  it("Test 4. Should REVERT: testUser_1 tries to burn tokens before anti flashloan holding period ends", async function () { 

    await testMinting("Test 4.1, minting 20 BNJI to caller", 20, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(20);
    await mintBlocks(5);  
    
    await expect( testBurning("Test 4.2, should REVERT, burning after 5 blocks", 10, testUser_1, testUser_1) ).to.be.revertedWith(
      "Anti-flashloan withdraw timeout in effect."
    );   

    expect(await balBNJI(testUser_1)).to.equal(20);
  });    

  
  it("Test 5. testUser_1 mints 19 tokens, then burns them after 11 blocks waiting time", async function () {   
    
    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balUSDC(testUser_1)).to.equal(3000); 

    await testMinting("Test 5.1, minting 19 BNJI to caller", 19, testUser_1, testUser_1);        

    const costInUSDC1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV/100;
    expect(await balBNJI(testUser_1)).to.equal(19); 
    expect(await balUSDC(testUser_1)).to.equal(3000-costInUSDC1);
    await mintBlocks(11); 
              
    await testBurning("Test 5.2, burning after 11 blocks", 19, testUser_1, testUser_1);

    const returnInUSDC1 = burnReturnWOfeeInUSDCShouldBeNowGlobalV;
    expect(await balBNJI(testUser_1)).to.equal(0);
    expect(await balUSDC(testUser_1)).to.equal(3000-costInUSDC1+returnInUSDC1); 

  });    
  
  it("Test 6. Should REVERT: testUser_1 tries to burn more tokens than they have", async function () {   
    
    await testMinting("Test 6.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(10);     
    await mintBlocks(11);    

    await expect( testBurning("Test 6.2, should REVERT, burning more BNJIs than user has", 12, testUser_1, testUser_1) ).to.be.revertedWith(
      "Insufficient Benjamins."
    );

    expect(await balBNJI(testUser_1)).to.equal(10);
  }); 

  it("Test 7. Token price should increase following bonding curve", async function () {      

    await testMinting("Test 7.1, minting 2000 BNJI to caller", 2000, testUser_1, testUser_1);
   
    expect(await balBNJI(testUser_1)).to.equal(2000);
    await mintBlocks(1);  
    
    const balanceUSDCbefore1stBN = await balUSDCin6decBN(testUser_1); 
    await testMinting("Test 7.2, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    
    const costInCents1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV;   
    expect(await balBNJI(testUser_1)).to.equal(2010); 

    const balanceUSDCafter1stBN = await balUSDCin6decBN(testUser_1);
    const firstPriceForTenInCents = dividefrom6decToUSDCcents(balanceUSDCbefore1stBN-balanceUSDCafter1stBN);  
    await mintBlocks(1);    

    await testMinting("Test 7.3, minting 1000 BNJI to caller", 1000, testUser_1, testUser_1);   
    
    expect(await balBNJI(testUser_1)).to.equal(3010);
    await mintBlocks(1);    

    const balanceUSDCbefore2ndBN = await balUSDCin6decBN(testUser_1);
    await testMinting("Test 7.4, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    const costInCents2 = mintAllowanceInUSDCCentsShouldBeNowGlobalV;

    expect(await balBNJI(testUser_1)).to.equal(3020);
    const balanceUSDCafter2ndBN = await balUSDCin6decBN(testUser_1);
    const secondPriceForTenInCents = dividefrom6decToUSDCcents(balanceUSDCbefore2ndBN-balanceUSDCafter2ndBN);

    expect(firstPriceForTenInCents).to.equal(costInCents1);
    expect(secondPriceForTenInCents).to.equal(costInCents2); 
  });  
  
  it("Test 8. Account levels and discounts should not be triggered below threshold", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await testMinting("Test 8.1, minting 19 BNJI to caller", 19, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(19);         
    await mintBlocks(1);     
    await addUserAccDataPoints(testUser_1); 

    await testMinting("Test 8.2, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(59);         
    await mintBlocks(1);    
    await addUserAccDataPoints(testUser_1); 

    await testMinting("Test 8.3, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(99);             
    await mintBlocks(1);      
    await addUserAccDataPoints(testUser_1); 

    await testMinting("Test 8.4, minting 400 BNJI to caller", 400, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(499);         
    await mintBlocks(1);      
    await addUserAccDataPoints(testUser_1); 

    await testMinting("Test 8.5, minting 1500 BNJI to caller", 1500, testUser_1, testUser_1);     

    expect(await balBNJI(testUser_1)).to.equal(1999); 
    await mintBlocks(1);    
    await addUserAccDataPoints(testUser_1);  

    const expectedUser1Levels = [0,0,1,2,3,4];
    const expectedUser1Discounts = [0,0,5,10,20,40];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts); 

  });  
  
  it("Test 9. Account levels should be triggered when reaching threshold", async function () {   

    await addUserAccDataPoints(testUser_1);  
    await testMinting("Test 9.1, minting 20 BNJI to caller", 20, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(20);         
    await mintBlocks(1);      

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 9.2, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);         
    await mintBlocks(1);      

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 9.3, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(100);             
    await mintBlocks(1);      

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 9.4, minting 400 BNJI to caller", 400, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(500);         
    await mintBlocks(1);      

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 9.5, minting 1500 BNJI to caller", 1500, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(2000);
    await mintBlocks(1);      
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,1,2,3,4,5];
    const expectedUser1Discounts = [0,5,10,20,40,75];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);     
  });  
  
  it("Test 10. Account Level 2 can be purchased in one go ", async function () {   

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 10, minting 60 BNJI to caller", 60, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);   
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,2];
    const expectedUser1Discounts = [0,10];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   
  });  

  it("Test 11. Account Level 3 can be purchased in one go ", async function () {   

    await addUserAccDataPoints(testUser_1);  
    await testMinting("Test 11, minting 100 BNJI to caller", 100, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(100); 
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,3];
    const expectedUser1Discounts = [0,20];    
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });  

  it("Test 12. Account Level 4 can be purchased in one go ", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await testMinting("Test 12, minting 500 BNJI to caller", 500, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(500);     
    await addUserAccDataPoints(testUser_1);    

    const expectedUser1Levels = [0,4];
    const expectedUser1Discounts = [0,40]; 
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });  

  it("Test 13. Account Level 5 can be purchased in one go ", async function () {   

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 13, minting 2000 BNJI to caller", 2000, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(2000);  
    await addUserAccDataPoints(testUser_1);

    const expectedUser1Levels = [0,5];
    const expectedUser1Discounts = [0,75];    
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });  

  it("Test 14. Minting inside of levels works as expected", async function () {   

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 14.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(10);
    await addUserAccDataPoints(testUser_1); 
    await mintBlocks(1); 

    await testMinting("Test 14.1, minting 9 BNJI to caller", 9, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(19);     
    await addUserAccDataPoints(testUser_1);    

    const expectedUser1Levels = [0,0,0];
    const expectedUser1Discounts = [0,0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });  
  
  
  it("Test 15. Account Level 1 is purchased by buying more than threshold, less than next threshold ", async function () {   

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 15, minting 25 BNJI to caller", 25, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(25);   
    await addUserAccDataPoints(testUser_1);   

    const expectedUser1Levels = [0,1];
    const expectedUser1Discounts = [0,5];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   
  });  

  it("Test 15. Larger purchases do not trigger more than account level 5 ", async function () {   

    await addUserAccDataPoints(testUser_1);
    await testMinting("Test 15.1, minting 2500 BNJI to caller", 2500, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(2500); 
    await addUserAccDataPoints(testUser_1);
    await mintBlocks(1); 

    await testMinting("Test 15.2, minting 2500 BNJI to caller", 1500, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(4000);  
    await addUserAccDataPoints(testUser_1);

    const expectedUser1Levels = [0,5,5];
    const expectedUser1Discounts = [0,75,75];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);
  });  
  
  
  it("Test 16. There is no time-lock for buying and discounts are effective immediately upon having the needed balance ", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await testMinting("Test 16.1, minting 2500 BNJI to caller", 25, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(25);   
    await addUserAccDataPoints(testUser_1);  
    await mintBlocks(1); 

    await testMinting("Test 16.2, minting 35 BNJI to caller", 35, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);   
    await addUserAccDataPoints(testUser_1);

    await testMinting("Test 16.3, minting 39 BNJI to caller", 39, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(99); 
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,1,2,2];
    const expectedUser1Discounts = [0,5,10,10];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);       
  });  

  it("Test 17. It is possible to skip levels by minting larger amounts of tokens", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await testMinting("Test 17.1, minting 2500 BNJI to caller", 25, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(25);       
    await addUserAccDataPoints(testUser_1);  
    await mintBlocks(1); 

    await testMinting("Test 17.2, minting 35 BNJI to caller", 75, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(100);  
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,1,3];
    const expectedUser1Discounts = [0,5,20];    
      
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   
  });  
  
  it("Test 18. It is possible to transfer tokens", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    await addUserAccDataPoints(testUser_1);
    await addUserAccDataPoints(testUser_2);     

    await testMinting("Test 18.1, minting 120 BNJI to user 1", 120, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(120); 
    await addUserAccDataPoints(testUser_1); 
    await mintBlocks(60); // TODO: dummy value for testing, 2 blocks per day, will be 43200 on polygon mainnet

    await testTransfer(40, testUser_1, testUser_2);
    
    expect(await balBNJI(testUser_1)).to.equal(80);    
    expect(await balBNJI(testUser_2)).to.equal(40);     
        
    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 
    
    const expectedUser1Levels = [0,3,2];
    const expectedUser1Discounts = [0,20,10];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,1];
    const expectedUser2Discounts = [0,5];    
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts);
  });  
  
  it("Test 19. It is possible to mint tokens to another account", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    await testMinting("Test 19, minting 120 BNJI from user 1 to user 2", 120, testUser_1, testUser_2);    
    
    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balBNJI(testUser_2)).to.equal(120);       
    
    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 
    await mintBlocks(1);     

    const expectedUser1Levels = [0,0];
    const expectedUser1Discounts = [0,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,3];
    const expectedUser2Discounts = [0,20];          
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts);
  });  
  
  it("Test 20. It is possible to burn tokens and reward the USDC to another account", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);         

    await testMinting("Test 20, minting 120 BNJI by testUser_1 for testUser_1", 120, testUser_1, testUser_1);    
    
    const costInUSDC1 = mintAllowanceInUSDCCentsShouldBeNowGlobalV/100; 
    expect(await balBNJI(testUser_1)).to.equal(120); 
    expect(await balBNJI(testUser_2)).to.equal(0);  
    await mintBlocks(60);    
    
    const user_1_USDCbalBefore = await balUSDC(testUser_1);
    const user_2_USDCbalBefore = await balUSDC(testUser_2);

    await testBurning("Test 20, burning 50 BNJI, by testUser_1 return goes to testUser_2", 50, testUser_1, testUser_2);    
    
    const returnInUSDC1 = burnReturnWOfeeInUSDCShouldBeNowGlobalV;
    expect(await balBNJI(testUser_1)).to.equal(70); 
    expect(await balBNJI(testUser_2)).to.equal(0);  

    const user_1_USDCbalAfter = await balUSDC(testUser_1);
    const user_2_USDCbalAfter = await balUSDC(testUser_2);      
        
    expect(user_1_USDCbalBefore).to.equal(3000-costInUSDC1);    
    expect(user_2_USDCbalBefore).to.equal(0);

    expect(user_1_USDCbalAfter).to.equal(user_1_USDCbalBefore);   
    expect(user_2_USDCbalAfter).to.equal(0 + returnInUSDC1);       

    //expect(user_1_USDCbalBefore).to.equal(user_1_USDCbalAfter);  
  });  
  
  it("Test 21. Should first REVERT: testUser_1 tries to transfer tokens before holding period ends, then correctly", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    await testMinting("Test 21, minting 60 BNJI to caller", 60, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);
    expect(await balBNJI(testUser_2)).to.equal(0);

    await addUserAccDataPoints(testUser_1);   
    await mintBlocks(5);    
    
    await expect( testTransfer(30,testUser_1, testUser_2) ).to.be.revertedWith(
      "Anti-flashloan withdraw timeout in effect."
    );

    expect(await balBNJI(testUser_1)).to.equal(60);
    expect(await balBNJI(testUser_2)).to.equal(0);
    await mintBlocks(5); 

    await expect( testTransfer(30,testUser_1, testUser_2) ).to.be.revertedWith(
      "Discount level withdraw timeout in effect."
    );

    expect(await balBNJI(testUser_1)).to.equal(60);
    expect(await balBNJI(testUser_2)).to.equal(0);
    await mintBlocks(4); 

    await testTransfer(30,testUser_1, testUser_2);

    expect(await balBNJI(testUser_1)).to.equal(30);
    expect(await balBNJI(testUser_2)).to.equal(30);

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2);
    
    const expectedUser1Levels = [0,2,1];
    const expectedUser1Discounts = [0,10,5];    
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts); 

    const expectedUser2Levels = [0,1];
    const expectedUser2Discounts = [0,5];    
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts); 
  });  
  
  it("Test 22. It is possible to skip levels by burning larger amounts of tokens", async function () {

    await addUserAccDataPoints(testUser_1); 
    await testMinting("Test 22.1, minting 600 BNJI to caller", 600, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(600);

    await addUserAccDataPoints(testUser_1);
    await mintBlocks(180);    

    //const needed = await benjaminsContract.getBlockAmountStillToWait(testUser_1);
    //decipherBlockFeedback(needed);     
    
    await testBurning("Test 22.2, burning 570 tokens after needed amount of blocks", 570, testUser_1, testUser_1);

    expect(await balBNJI(testUser_1)).to.equal(30);  
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,4,1];
    const expectedUser1Discounts = [0,40,5];        
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);        
  });
  
  /*
  it("Test 23. There is a transfer fee on transfers.", async function () {  // TODO: see about this functionality

    await addUserAccDataPoints(testUser_1);    
    await addUserAccDataPoints(testUser_2);  

    await testMinting("Test 23.1, minting 506 BNJI to caller", 506, testUser_1, testUser_1);  

    expect(await balBNJI(testUser_1)).to.equal(506);
    expect(await balBNJI(testUser_2)).to.equal(0);

    await addUserAccDataPoints(testUser_1);
    await mintBlocks(180);        
    
    await benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 506); 
      
    await addUserAccDataPoints(testUser_1);    
    await addUserAccDataPoints(testUser_2);   

    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balBNJI(testUser_2)).to.equal(506);     

    const expectedUser1Levels = [0,4,0];
    const expectedUser1Discounts = [0,40,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   

    const expectedUser2Levels = [0,4];
    const expectedUser2Discounts = [0,40];          
    confirmUserDataPoints(testUser_2, expectedUser2Levels, expectedUser2Discounts); 
  });*/

  
  it("Test 24. Activating pause() should lock public access to state changing functions, but allow owner.", async function () { 
    
    // setup for test, testUser_1 mints 510 BNJIs and waits 180 blocks,
    // after that, user would normally be able to transfer, burn etc
    await addUserAccDataPoints(testUser_1);        
    await testMinting("Test 23.1, minting 506 BNJI to caller", 510, testUser_1, testUser_1);  
    expect(await balBNJI(testUser_1)).to.equal(510);
    await mintBlocks(180);

    // anybody who is not the owner cannot activate pause()
    await expect( benjaminsContract.connect(testUser_1_Signer).pause() ).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );   

    // owner activates pause()
    await benjaminsContract.connect(deployerSigner).pause(); 
    
    // when pause has been activated, normal users cannot use transfer
    await expect( benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 10)).to.be.revertedWith(
      "Benjamins is paused."
    );
    
    // when pause has been activated, normal users cannot use transferFrom
    await expect( benjaminsContract.connect(testUser_1_Signer).transferFrom(testUser_2, testUser_3, 10)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use mint
    await expect( benjaminsContract.connect(testUser_1_Signer).mint(12)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use mintTo
    await expect( benjaminsContract.connect(testUser_1_Signer).mintTo(14, testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );
    
    // when pause has been activated, normal users cannot use burn
    await expect( benjaminsContract.connect(testUser_1_Signer).burn(11)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use burnTo
    await expect( benjaminsContract.connect(testUser_1_Signer).burnTo(16, testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use quoteUSDC
    await expect( benjaminsContract.connect(testUser_1_Signer).quoteUSDC(100, true)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use discountLevel
    await expect( benjaminsContract.connect(testUser_1_Signer).discountLevel(testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use quoteFeePercentage
    await expect( benjaminsContract.connect(testUser_1_Signer).quoteFeePercentage(testUser_2)).to.be.revertedWith(
      "Benjamins is paused."
    );

    // when pause has been activated, normal users cannot use quoteFeePercentage
    await expect( benjaminsContract.connect(testUser_1_Signer).calcTransportFee(100)).to.be.revertedWith(
      "Benjamins is paused."
    );
    
    
    //test preparation verification, contract owner should have 282840 tokens from "First Setup mint for 100k USDC"
    expect(await balBNJI(deployer)).to.equal(282840);
    // awaiting another 540 blocks, so that deployer can transfer and burn, since acc level 5
    await mintBlocks(540);
    // preparation for transfer, mint, etc., contract owner gives more than necessary USDC approval to benjaminsContract
    await polygonUSDC.connect(deployerSigner).approve(benjaminsContract.address, multiplyFromUSDCto6dec(10000));  
    
    // when paused is active, contract owner can use transfer
    expect(await balBNJI(testUser_2)).to.equal(0);    
    await benjaminsContract.connect(deployerSigner).transfer(testUser_2, 10);
    expect(await balBNJI(testUser_2)).to.equal(10);  
    expect(await balBNJI(deployer)).to.equal(282830);
    
    // todo: show USDC fee that was taken from testUser_1_Signer
    // preparation for transferFrom, testUser_1 gives more than necessary USDC approval to benjaminsContract
    await polygonUSDC.connect(testUser_1_Signer).approve(benjaminsContract.address, multiplyFromUSDCto6dec(10000));  
    // preparation for transferFrom, testUser_1 allows owner to handle 100 BNJIs 
    await benjaminsContract.connect(testUser_1_Signer).approve(deployer, 100);    
    // when paused is active, contract owner can use transferFrom to move 10 BNJIs from testUser_1 to testUser_3
    expect(await balBNJI(deployer)).to.equal(282830); 
    expect(await balBNJI(testUser_1)).to.equal(510); 
    expect(await balBNJI(testUser_3)).to.equal(0); 
    await benjaminsContract.connect(deployerSigner).transferFrom(testUser_1, testUser_3, 10);
    expect(await balBNJI(deployer)).to.equal(282830); 
    expect(await balBNJI(testUser_1)).to.equal(500); 
    expect(await balBNJI(testUser_3)).to.equal(10); 
    
    // when paused is active, contract owner can use mint
    expect(await balBNJI(deployer)).to.equal(282830); 
    await benjaminsContract.connect(deployerSigner).mint(12);
    expect(await balBNJI(deployer)).to.equal(282842); 

    // when paused is active, contract owner can use mintTo to mint 14 BNJIs to testUser_2
    expect(await balBNJI(deployer)).to.equal(282842); 
    expect(await balBNJI(testUser_2)).to.equal(10);
    await benjaminsContract.connect(deployerSigner).mintTo(14, testUser_2);
    expect(await balBNJI(deployer)).to.equal(282842);
    expect(await balBNJI(testUser_2)).to.equal(24);    
    
    // when paused is active, contract owner can use burn
    expect(await balBNJI(deployer)).to.equal(282842);
    await benjaminsContract.connect(deployerSigner).burn(11);
    expect(await balBNJI(deployer)).to.equal(282831);

    // when paused is active, contract owner can use burnTo
    expect(await balBNJI(deployer)).to.equal(282831);
    expect(await balUSDCinCents(testUser_2)).to.equal(0);        
    await benjaminsContract.connect(deployerSigner).burnTo(16, testUser_2);       
    expect(await balUSDCinCents(testUser_2)).to.equal(1128);

    // when paused is active, contract owner can use quoteUSDC
    const tokenValueIn6dec = await benjaminsContract.connect(deployerSigner).quoteUSDC(100, true);
    expect(tokenValueIn6dec).to.equal(70840000);

    // when paused is active, contract owner can use discountLevel
    const accountLevel = await benjaminsContract.connect(deployerSigner).discountLevel(testUser_1);
    expect(accountLevel).to.equal(4);

    // when paused is active, contract owner can use quoteFeePercentage
    const feeModifier = await benjaminsContract.connect(deployerSigner).quoteFeePercentage(testUser_1);
    expect(feeModifier).to.equal(baseFee*6000);

    // when paused is active, contract owner can use calcTransportFee
    const transportFee = await benjaminsContract.connect(deployerSigner).calcTransportFee(100);
    expect(transportFee).to.equal(350000);

    // verifying once more that benjaminsContract is still paused
    expect(await benjaminsContract.paused()).to.equal(true);

    // anybody who is not the owner cannot deactivate pause()
    await expect( benjaminsContract.connect(testUser_1_Signer).unpause() ).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );   
    
    // owner deactivates pause()
    await benjaminsContract.connect(deployerSigner).unpause();
    expect(await  benjaminsContract.paused()).to.equal(false);
    
  });//*/

  
}); 
