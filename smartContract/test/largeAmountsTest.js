const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV = 0;
let mintPriceTotalInUSDCcentsShouldBeNowGlobalV = 0; 
let mintFeeInUSDCcentsShouldBeNowGlobalV = 0; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV = 0;
let burnReturnTotalInUSDCcentsShouldBeNowGlobalV = 0;
let burnFeeInUSDCcentsShouldBeNowGlobalV = 0;

let tokensExistQueriedGlobalV = 0;
let mintPriceTotalInUSDCcentsWasPaidNowGlobalV = 0;
let mintFeeInUSDCcentsWasPaidNowGlobalV = 0;
let mintAllowanceInUSDCCentsWasNowGlobalV = 0;
let burnReturnTotalInUSDCcentsWasPaidNowGlobalV = 0;
let burnFeeInUSDCcentsWasPaidNowGlobalV = 0;

let protocolUSDCbalWithoutInteresInCentsGlobalV = 0;
let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let randomAmountBurning = 0;

let totalSpentInCents = 0;
let totalReturnedInCents = 0;
let totalUSDCcentsInTestAccs = 0;
let startTotalUSDCcents = 0;


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
  //console.log(callingAccAddress, 'callingAccAddress in testTransfer');
  //console.log(amountBNJIsToTransfer, 'amountBNJIsToTransfer in testTransfer');
  //console.log(receivingAddress, 'receivingAddress in testTransfer');
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(callingAccAddress)); 
  //console.log(userLevel, 'userLevel in testTransfer');

  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  const feeInCentsRoundedDown = await calcBurnVariables(amountBNJIsToTransfer, callingAccAddress, true);  
  //console.log(feeInCentsRoundedDown, 'feeInCentsRoundedDown to be approved in testTransfer');    
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, multiplyFromUSDCcentsTo6dec(feeInCentsRoundedDown));
  // calling transfer function on benjaminscontract  
  await benjaminsContract.connect(callingAccSigner).transfer(receivingAddress, amountBNJIsToTransfer);
}

async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

  const callingAccountName = findUsernameForAddress(callingAccAddress);  
  //console.log('calling address in testMinting is now:', callingAccountName, callingAccAddress);  
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
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint, callingAccAddress); 
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

  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds received by the protocol, from the user
  const againstInterestDistortionInCents = callingAccMintPricePaidInCents - feeReceiverUSDCdiffMintInCents;
  protocolUSDCbalWithoutInteresInCentsGlobalV += againstInterestDistortionInCents;
  
  //console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeMintInCents), `benjaminsContract amUSDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterMintInCents), `benjaminsContract amUSDC balance after ${mintName}`);

  //console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents), `${receivingAccountName} USDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents), `${receivingAccountName} USDC balance after ${mintName}`);    

  //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeMintInCents), `feeReceiver USDC balance before ${mintName}`);
  //console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterMintInCents), `feeReceiver USDC balance after ${mintName}`);
  const shouldbeCostPlusFeeInCents = againstInterestDistortionInCents + feeReceiverUSDCdiffMintInCents;

  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents), `${receivingAccountName} mint price paid in USDC <==========================`);
  //console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `approx. of what benjaminsContract received in amUSDC (incl. interest already accrued)`);
  console.log(shouldbeCostPlusFeeInCents/100, 'should be equal to line above, callingAccMintPricePaidInCents')

  console.log(againstInterestDistortionInCents, 'saved this as mint cost without fee <======')
  console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver mint fee received in USDC:`);  
  //console.log(fromCentsToUSDC(callingAccMintPricePaidInCents - contractAMUSDCdiffMintInCents), `approx. of what should be the fee received, in USDC (difference between paid by user and received by protocol, changed by interest already accrued)`); 

  
 


  console.log(totalSupplyBeforeMint, `Benjamins total supply before minting ${amountToMint} Benjamins`); 
  //console.log(totalSupplyAfterMint, `Benjamins total supply after minting ${amountToMint} Benjamins`); 

  //console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${mintName}`);
  //console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${mintName}`);

  console.log(receivingAddressBNJIbalBeforeMint, `receivingAddress owns/manages this many benjamins before ${mintName}`);
  //console.log(receivingAddressBNJIbalAfterMint, `receivingAddress owns/manages this many benjamins after ${mintName}`);

  
  mintPriceTotalInUSDCcentsWasPaidNowGlobalV = callingAccMintPricePaidInCents;
  mintFeeInUSDCcentsWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents;
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

  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds paid out by the protocol, to the user, plus fees, paid by protocol to feeReceiver
  const againstInterestDistortionInCents = receivingAccBurnReturnReceivedInCents + feeReceiverUSDCdiffBurnInCents;
  protocolUSDCbalWithoutInteresInCentsGlobalV -= againstInterestDistortionInCents;

  console.log(fromCentsToUSDC(receivingAccBurnReturnReceivedInCents), `${receivingAccountName} burn return received in USDC <==========================`);
  
  console.log(againstInterestDistortionInCents/100, 'fee + burn return, total paid by protocol, in USDC: <======');

 




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

  burnReturnTotalInUSDCcentsWasPaidNowGlobalV = receivingAccBurnReturnReceivedInCents;
  burnFeeInUSDCcentsWasPaidNowGlobalV = feeReceiverUSDCdiffBurnInCents;
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  confirmBurn();

 //console.log(`==============================================================================`);
 //console.log(`==============================================================================`);

};

function resetTrackers(){
  tokensShouldExistNowGlobalV = 0;
  mintPriceTotalInUSDCcentsShouldBeNowGlobalV = 0; 
  mintFeeInUSDCcentsShouldBeNowGlobalV = 0; 

  mintAllowanceInUSDCCentsShouldBeNowGlobalV = 0;
  burnReturnTotalInUSDCcentsShouldBeNowGlobalV = 0;
  burnFeeInUSDCcentsShouldBeNowGlobalV = 0;

  tokensExistQueriedGlobalV = 0;
  mintPriceTotalInUSDCcentsWasPaidNowGlobalV = 0;
  mintFeeInUSDCcentsWasPaidNowGlobalV = 0;

  mintAllowanceInUSDCCentsWasNowGlobalV = 0;
  burnReturnTotalInUSDCcentsWasPaidNowGlobalV = 0;
  burnFeeInUSDCcentsWasPaidNowGlobalV = 0;
} 

function confirmMint(){  
  console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmMint');
  console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmMint');
  
  console.log(mintPriceTotalInUSDCcentsShouldBeNowGlobalV, 'mintPriceTotalInUSDCcentsShouldBeNowGlobalV, confirmMint');
  console.log(mintPriceTotalInUSDCcentsWasPaidNowGlobalV, 'mintPriceTotalInUSDCcentsWasPaidNowGlobalV, confirmMint');

  console.log(mintFeeInUSDCcentsShouldBeNowGlobalV, 'mintFeeInUSDCcentsShouldBeNowGlobalV, confirmMint');
  console.log(mintFeeInUSDCcentsWasPaidNowGlobalV, 'mintFeeInUSDCcentsWasPaidNowGlobalV, confirmMint');

  console.log(mintAllowanceInUSDCCentsShouldBeNowGlobalV, 'mintAllowanceInUSDCCentsShouldBeNowGlobalV, confirmMint');
  console.log(mintAllowanceInUSDCCentsWasNowGlobalV, 'mintAllowanceInUSDCCentsWasNowGlobalV, confirmMint');

  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCcentsShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCcentsWasPaidNowGlobalV));
  expect(mintFeeInUSDCcentsShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCcentsWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
  
};

function confirmBurn(){  
  console.log(tokensShouldExistNowGlobalV, 'tokensShouldExistNowGlobalV, confirmBurn');
  console.log(tokensExistQueriedGlobalV, 'tokensExistQueriedGlobalV, confirmBurn');
  
  console.log(burnReturnTotalInUSDCcentsShouldBeNowGlobalV, 'burnReturnTotalInUSDCcentsShouldBeNowGlobalV, confirmBurn');
  console.log(burnReturnTotalInUSDCcentsWasPaidNowGlobalV, 'burnReturnTotalInUSDCcentsWasPaidNowGlobalV, confirmBurn');
  
  console.log(burnFeeInUSDCcentsShouldBeNowGlobalV, 'burnFeeInUSDCcentsShouldBeNowGlobalV, confirmBurn');
  console.log(burnFeeInUSDCcentsWasPaidNowGlobalV, 'burnFeeInUSDCcentsWasPaidNowGlobalV, confirmBurn');

  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  expect(burnReturnTotalInUSDCcentsShouldBeNowGlobalV).to.equal(Number(burnReturnTotalInUSDCcentsWasPaidNowGlobalV));
  expect(burnFeeInUSDCcentsShouldBeNowGlobalV).to.equal(Number(burnFeeInUSDCcentsWasPaidNowGlobalV));
};

async function calcMintApprovalAndPrep(amountToMint, accountMinting) {  
  
  const amountOfTokensBeforeMint = bigNumberToNumber(await benjaminsContract.totalSupply());
  const amountOfTokensAfterMint = Number (amountOfTokensBeforeMint) + Number (amountToMint);  

  const usersTokenAtStart = await balBNJI(accountMinting);
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountMinting));
  const accName = findUsernameForAddress(accountMinting);
  console.log(accName, 'has account level:', userLevel, 'calcMintApprovalAndPrep <======================'); 
  
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
  mintPriceTotalInUSDCcentsShouldBeNowGlobalV = toPayTotalInCents;
  mintFeeInUSDCcentsShouldBeNowGlobalV = mintFeeInCentsRoundedDown;
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
    burnReturnTotalInUSDCcentsShouldBeNowGlobalV = toReceiveTotalInCents;
    burnFeeInUSDCcentsShouldBeNowGlobalV = burnFeeInCentsRoundedDown;
  } else {
    return burnFeeInCentsRoundedDown;
  }
  //console.log("tokensShouldExistNowGlobalV:", tokensShouldExistNowGlobalV );
  //console.log("burnReturnTotalInUSDCcentsShouldBeNowGlobalV:", burnReturnTotalInUSDCcentsShouldBeNowGlobalV );

  //console.log(usersTokenAtStart, "this is the burning users token balance found at start, calcBurnVariables");  
  //console.log(userLevel, "this is the burning users account level found at start, calcBurnVariables");
  //console.log(feeModifier/100, "this is the applicable fee modifier in percent found at start, calcBurnVariables");  
}

async function getSignersAndStoreAddr(){
  /*
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
  */

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

// checking balances and adding them up
async function checkTestAddresses(amountUSDC, amountMatic, amountBNJI, expectBool){
  for (let index = 0; index < 10; index++) {
    const testUserAddress = testUserAddressesArray[index];     
    const callingAccountName = findUsernameForAddress(testUserAddress);
    const testAccUSDCcentsbal = await balUSDCinCents(testUserAddress);
    const testAccMATICbal = await getMaticBalance(testUserAddress);
    const testAccBNJIbal = await balBNJI(testUserAddress);

    // if arg 'expectBool' was sent in as true, verify preparation did work as expected
    if (expectBool == true){
      //console.log(`testUserAddressesArray[${index}] is:`, testUserAddress);
      //console.log(`and it's name is:`, callingAccountName);
      //console.log(`${callingAccountName} has this many USDC after preparation:`, testAccUSDCcentsbal);
      //console.log(`${callingAccountName} has this many Matic after preparation:`, testAccMATICbal); 
      //console.log(`${callingAccountName} has this many Matic after preparation:`, testAccBNJIbal);   
      expect(testAccUSDCcentsbal).to.equal(amountUSDC*100);
      expect(testAccMATICbal).to.equal(amountMatic);
      expect(testAccBNJIbal).to.equal(amountBNJI);
    }  
    // add each account's amount of USDCcents onto the counter
    totalUSDCcentsInTestAccs += testAccUSDCcentsbal;    
  }
  let nowUSDCcentsInAllTestAccs = totalUSDCcentsInTestAccs;
  // keep log of all USDCcents found in testaccounts, save each reound of queries to totalUSDCcentsEntriesArr
  totalUSDCcentsEntriesArr.push(totalUSDCcentsInTestAccs);
  if (totalUSDCcentsEntriesArr.length == 1 ) {startTotalUSDCcents = totalUSDCcentsInTestAccs}
  console.log('These are the entries each time all USDCcents were counted: ', totalUSDCcentsEntriesArr);
  // reset counter for next round of queries
  totalUSDCcentsInTestAccs = 0;
  return nowUSDCcentsInAllTestAccs;
}


//async function





async function runMintOrBurnLoop(loopsToRun, runMint, accOrderArray) {
  let randomMintOrBurn;
  let mintCounter = 0;
  let burnCounter = 0;

  let accPosCounter;

  // running either minting or burning, this many loops: loopsToRun
  for (loopCounter = 1; loopCounter <= loopsToRun; loopCounter++) {
    
    // accounts are up next in the order they are sent in via accOrderArray
    // when all 10 test accounts acted, array starts over, until loopsToRun are all done
    accPosCounter = loopCounter-1;
    if (accPosCounter>=10){
      accPosCounter = accPosCounter%10;
    }
    //console.log("accPosCounter is:", accPosCounter)
    const accNrNow = accOrderArray[accPosCounter];
    const accNow = testUserAddressesArray[accNrNow];    
    const signerNow = await ethers.provider.getSigner(accNow);
    const accNowName = findUsernameForAddress(accNow);     

    const balUSDCcentsAtStart = await balUSDCinCents(accNow);
    console.log(balUSDCcentsAtStart, `before operation nr: ${loopCounter}, ${accNowName} has this many USDC CENTS`);          
    
    const balBNJIsAtStart = await balBNJI(accNow);
    console.log(balBNJIsAtStart, `before operation nr: ${loopCounter}, ${accNowName} has this many BNJIs`);           

    // MINTING
    // if runMint == true, mint. 
    if (runMint == true) {
      console.log(`operation nr: ${loopCounter} is MINTING`);      

      // local function to check minting amount repeatedly until it's okay
      async function checkMintingAmountOkay() {
        if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 506 || (mintAllowanceInUSDCCentsShouldBeNowGlobalV) > balUSDCcentsAtStart) {
          if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 506) {
            console.log(`RECALC, mint call would be under $5`);  
            randomAmountMinting = Math.floor (Math.random() * 10000); 
          }
          if ((mintAllowanceInUSDCCentsShouldBeNowGlobalV) > balUSDCcentsAtStart){
            console.log(`RECALC, mint call would be too big for ${accNowName}'s USDC balance`) 
            // halving the randomAmountMinting from before and rounding it down to full integers
            randomAmountMinting = Math.floor(randomAmountMinting* 0.5); 
          }          
          
          console.log('RECALC randomAmountMinting', randomAmountMinting);
          await calcMintApprovalAndPrep(randomAmountMinting, accNow);  // this call will change mintAllowanceInUSDCCentsShouldBeNowGlobalV, so no endless loop
          checkMintingAmountOkay();         
        } 
      }

      // randomizing amount to mint
      let randomAmountMinting = Math.floor (Math.random() * 10000);
      console.log('randomAmountMinting', randomAmountMinting);         
            
      await calcMintApprovalAndPrep(randomAmountMinting, accNow);
      
      checkMintingAmountOkay(); // checking if amount is okay

      console.log(`operation nr: ${loopCounter} will MINT this many tokens:`, randomAmountMinting);

      mintCounter++;
      //testMinting(mintName, amountToMint, callingAccAddress, receivingAddress)
      //testMinting(mintName, amountToMint, ammountToApproveInCents, callingAcc, nrOfFaucetCalls)
      await testMinting(`operation nr: ${loopCounter}, minting`, randomAmountMinting, accNow, accNow);

      totalSpentInCents += mintPriceTotalInUSDCcentsWasPaidNowGlobalV;    

    } 
    
  
    // BURNING
    // if runMint == false, burn.
    else {
      console.log(`operation nr: ${loopCounter} is BURNING`);        
      
      let burnHalf = Math.floor (balBNJIsAtStart * 0.5);
      console.log(burnHalf, "this is burnHalf");
      
      //calcBurnVariables(amountToBurn, accountBurning, isTransfer);  
      calcBurnVariables(burnHalf, accNow, false);

      if(burnReturnTotalInUSDCcentsShouldBeNowGlobalV >= 600) {
        console.log(`operation nr: ${loopCounter} will BURN this many tokens:`, burnHalf);
        burnCounter++;

        //testBurning(burnName, amountToBurn, callingAcc)
        await testBurning(`operation nr: ${loopCounter}, burning`, burnHalf, accNow, accNow);

        totalReturnedInCents += burnReturnTotalInUSDCcentsWasPaidNowGlobalV;

      }
            
    }    
    
  }

  loopCounterTotal += loopCounter;
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;

  console.log(`test ran ${loopCounterTotal} loops so far, of which ${mintCounterTotal} were mints and ${burnCounterTotal} were burns`); 
  //console.log(`so far, ${totalSpentInCents/100} USDC were spent by the testusers (plus deployer) and ${totalReturnedInCents/100} USDC were paid out by the contract in total`);   

  const protocolBalanceAfterTestInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)) );
  //console.log(`our contract's amUSDC balance at the end of all loops so far`, protocolBalanceAfterTestInCents);
  //const protocolBalanceAfterTestJSExactness = Number(protocolBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  /*
  const acc5MockUSDCBalanceAfterTest = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonAmUSDC.balanceOf(accounts[5].address)) );
  console.log(` ${accNow}'s USDC balance at the end of all loops so far`, acc5MockUSDCBalanceAfterTest);
  const acc5MockUSDCBalanceAfterTestJSExactness = Number(acc5MockUSDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);
  */

  
 
  const feeReceiverUSDCbalAfterTestsInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonUSDC.balanceOf(feeReceiver)) );
  //const mintFee100kMintInCents = dividefrom6decToUSDCcents(999980000);
  //const feeReceiverWOUT100kMintFee = feeReceiverUSDCbalAfterTestsInCents - mintFee100kMintInCents;
  
  //const testAccountsBalInCents = await checkTestAddresses();
  //const protocolBalwithoutInterestInCents = protocolUSDCbalWithoutInteresInCentsGlobalV;
  //const deployer100kMintInCents = dividefrom6decToUSDCcents(100998060000);

  //OLD const inTotalUSDCExistafterTestInCents = (protocolBalwithoutInterestInCents - deployer100kMintInCents) + testAccountsBalInCents + mintFee100kMintInCents; 
 
  //const inTotalUSDCExistafterTestInCents = protocolBalwithoutInterestInCents + testAccountsBalInCents; 
  //console.log('JS * 100 check', inTotalUSDCExistafterTest);


  //const jsExactnessResolved = inTotalUSDCExistafterTestInCents / 100;
  //console.log('in total USDC at the end of all loops so far', jsExactnessResolved);


  const endTokenBalance = bigNumberToNumber(await benjaminsContract.totalSupply() );
  const valueBNJIsExistingInCents = dividefrom6decToUSDCcents(await benjaminsContract.quoteUSDC(endTokenBalance, false) /*- deployer100kMintInCents*/);

  console.log('at the end of all loops so far, this many tokens exist:', endTokenBalance);  
  console.log(valueBNJIsExistingInCents/100, `if all these tokens were burnt, they would be worth this much USDC, before fees (to take off)`);
  console.log(protocolUSDCbalWithoutInteresInCentsGlobalV/100, 'protocol should have this many (am)USDC, without interest so far');
  console.log(protocolBalanceAfterTestInCents/100, 'protocol has this many funds in amUSDC, incl interest so far');  
  console.log(feeReceiverUSDCbalAfterTestsInCents/100, `feeReceiver's USDC balance at the end of all loops so far`);

  
  //console.log(startTotalUSDCcents, 'this was the startTotalUSDCcents');
 // const difference = inTotalUSDCExistafterTestInCents - startTotalUSDCcents;
  //console.log(difference, `The difference between total USDC Cents at start and end is this much`); 
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

      await polygonUSDC.connect(deployerSigner).transfer(testUserAddress, (200000*scale6dec) );      
          
    } 
    
  })      

  it("1.: Preparation verification: each of the 10 test users has 200k USDC, 10 Matic and 0 BNJI", async function () {    
        
    await checkTestAddresses(200000,10,0, true);

    /*
    await testMinting("Test 1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);      
    expect(await balBNJI(testUser_1)).to.equal(10);*/
    
  });
  
  
  it("2.: Large amount test: 34 mints", async function () { 
    //async function runMintOrBurnLoop(loopsToRun, runMint, accOrderArray) {
    let accOrderArray1 = [9,8,7,6,5,4,3,2,1,0];  
    await runMintOrBurnLoop(34, true, accOrderArray1);
        
  });
  
  it("3.: Large amount test: 28 burns", async function () { 
    //async function runMintOrBurnLoop(loopsToRun, runMint, accOrderArray) {
    let accOrderArray2 = [0,8,3,6,5,1,7,2,4,9];  
    await runMintOrBurnLoop(28, false, accOrderArray2);
   
    
  });
  

  
}); 
