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

let burnReturnStillInclFeesInUSDCcentsGlobalV = 0;
let protocolUSDCbalWithoutInteresInCentsGlobalV = 0;
let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let not5USDCworthCounter = 0;

let randomAmountBurning = 0;

let totalSpentInCents = 0;
let totalReturnedInCents = 0;
let totalUSDCcentsInTestAccs = 0;
let startTotalUSDCcents = 0;

let totalUSDCcentsEntriesArr = [];

const scale6dec = 1000000;

const baseFee = 2;
const levelAntesArray =     [ 0, 20, 60, 100, 500, 2000];    
const levelDiscountsArray = [ 0, 5,  10,  20,  40,   75]; 

let benjaminsContract;

const polygonMATICaddress = '0x0000000000000000000000000000000000001010';

let polygonUSDC;
const polygonUSDCaddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let polygonLendingPool;
const polygonLendingPoolAddress = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

let polygonETH;
const polygonWETHaddress = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';

let polygonWMATIC;
const polygonWMATICaddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

let whaleSignerAddress;

let testUserAddressesArray = [];

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

// helper function to console log for testing/debugging: looking up the accounts[] variable for an address 
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

  } 
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

function getRoundedFee(userLevel, principalInUSDCcents){    
  const feeModifier = (100 * baseFee * (100-levelDiscountsArray[userLevel])) /10000;
  const feeStarterInCents = ((principalInUSDCcents * feeModifier ) /100);   
  const feeInCentsRoundedDown = feeStarterInCents - (feeStarterInCents % 1);
  return feeInCentsRoundedDown  
}

async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

  const callingAccountName = findUsernameForAddress(callingAccAddress);  
   
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
  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);
  
  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  
  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
    
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  
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
  
  const shouldbeCostPlusFeeInCents = againstInterestDistortionInCents + feeReceiverUSDCdiffMintInCents;
 
  mintPriceTotalInUSDCcentsWasPaidNowGlobalV = callingAccMintPricePaidInCents;
  mintFeeInUSDCcentsWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();
};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) { 

  const callingAccountName = findUsernameForAddress(callingAccAddress);
  
  const receivingAccountName = findUsernameForAddress(receivingAddress);  

  const totalSupplyBeforeBurn = bigNumberToNumber( await benjaminsContract.totalSupply() );

  const callingAddressBNJIbalBeforeBurn = await balBNJI(callingAccAddress);
  const contractBNJIbalBefore = await balBNJI(benjaminsContract.address); 

  const receivingAddressUSDCBalanceBeforeBurnInCents = await balUSDCinCents(receivingAddress); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceBeforeBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn, callingAccAddress);
  
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);  
 
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

  burnReturnTotalInUSDCcentsWasPaidNowGlobalV = receivingAccBurnReturnReceivedInCents;
  burnFeeInUSDCcentsWasPaidNowGlobalV = feeReceiverUSDCdiffBurnInCents;
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  confirmBurn();
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
  
  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCcentsShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCcentsWasPaidNowGlobalV));
  expect(mintFeeInUSDCcentsShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCcentsWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
  
};

function confirmBurn(){  
  
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
 
  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 800000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostRoundedDownInCents = mintingCostInCents - (mintingCostInCents % 1);

  const mintFeeInCentsRoundedDown = getRoundedFee(userLevel, mintingCostRoundedDownInCents);  
  
  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostRoundedDownInCents + mintFeeInCentsRoundedDown;
  const toPayTotalInUSDC = toPayTotalInCents / 100;
  const toPayTotalIn6dec = toPayTotalInCents * 10000;    

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCcentsShouldBeNowGlobalV = toPayTotalInCents;
  mintFeeInUSDCcentsShouldBeNowGlobalV = mintFeeInCentsRoundedDown;
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = toPayTotalInCents;  

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
    burnReturnStillInclFeesInUSDCcentsGlobalV = burnReturnRoundedDownInCents;
  } else {
    return burnFeeInCentsRoundedDown;
  }
  
}

async function storeAddr(){ 
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
  console.log(`These are the entries each time all testusers' USDCcents were counted: `, totalUSDCcentsEntriesArr);
  // reset counter for next round of queries
  totalUSDCcentsInTestAccs = 0;
  return nowUSDCcentsInAllTestAccs;
}

let liquidCentsArray = [];
async function countAllCents() {
  const centsInTestUser_1 = await balUSDCinCents(testUser_1);
  const feeReceiverCents = await balUSDCinCents(feeReceiver); 
  const protocolCents = protocolUSDCbalWithoutInteresInCentsGlobalV;
  const deployerCents = await balUSDCinCents(deployer);

  const allLiquidCents = centsInTestUser_1 + feeReceiverCents + protocolCents + deployerCents;  

  liquidCentsArray.push(allLiquidCents);  

  console.log(`These are the entries each time all liquid USDCcents were counted, liquidCentsArray: `, liquidCentsArray); 
}

async function minimizedMint(){

  //  formula for minting for a specified amount of currency (totalPriceForTokensMintingNow) :
  //  totalSupplyAfterMinting = SquareRootOf ( (totalPriceForTokensMintingNow * 800000) + (totalSupplyBeforeMinting ^2) )
  //  tokenAmountMintingNow = totalSupplyAfterMinting - totalSupplyBeforeMinting  

  const currencyToSpendNow = 5;   // this means minting for $5 each time
  const totalSupplyExisting = await benjaminsContract.totalSupply();

  const totalSupplyAfterMinting = Math.sqrt((currencyToSpendNow * 800000) + (totalSupplyExisting * totalSupplyExisting));

  const tokensMintingNow = totalSupplyAfterMinting - totalSupplyExisting;

  const roundedToInteger = Math.ceil(tokensMintingNow);
  //console.log(roundedToInteger,'trying to mint this amount of BNJIs');
  return roundedToInteger;

}

async function minimizedBurn() {
  // formula for burning to get a specified amount of currency
  // totalSupplyAfterBurning = SquareRootOf ( (totalSupplyBeforeBurning ^2) - (totalCurrencyForTokensBurningNow * 800000) )
  // amountOfTokensBurningNow = totalSupplyBeforeBurning - totalSupplyAfterBurning

  const currencyToBePaidOutNow = 5.01;   // this means burning for $5 each time
  const totalSupplyExisting = await benjaminsContract.totalSupply(); 

  if (totalSupplyExisting < 2000) {not5USDCworthCounter += 1};

    const totalSupplyAfterBurning = Math.sqrt( (totalSupplyExisting * totalSupplyExisting) - (currencyToBePaidOutNow * 800000) );

    const tokensToBurnNow = totalSupplyExisting - totalSupplyAfterBurning;

    const roundedToInteger = Math.ceil(tokensToBurnNow);
  
  return roundedToInteger;

}

async function runMintOrBurnLoop(loopsToRun, runMint, accNow, testNr) {
  
  let mintCounter = 0;
  let burnCounter = 0;  

  // running either minting or burning, this many loops: loopsToRun
  for (loopCounter = 1; loopCounter <= loopsToRun; loopCounter++) {
         
    const signerNow = await ethers.provider.getSigner(accNow);
    const accNowName = findUsernameForAddress(accNow);     

    const balUSDCcentsAtStart = await balUSDCinCents(accNow);
    
    const balBNJIsAtStart = await balBNJI(accNow);
    
    // MINTING
    // if runMint == true, mint. 
    if (runMint == true) {
      
      // randomizing amount to mint
      let minAmountMinting = await minimizedMint();       
            
      await calcMintApprovalAndPrep(minAmountMinting, accNow);    

      console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} MINTS this many tokens:`, minAmountMinting);

      mintCounter++;
      
      await testMinting(`operation nr: ${loopCounter}, minting`, minAmountMinting, accNow, accNow);

      totalSpentInCents += mintAllowanceInUSDCCentsShouldBeNowGlobalV;  

    }   
    

  
    // BURNING
    // if runMint == false, burn.
    else {     
      
      //console.log(`In ${testNr}, operation nr: ${loopCounter} this many tokens exist:`, bigNumberToNumber(await benjaminsContract.totalSupply() )); 

      let minAmountBurning = await minimizedBurn(); // this means burning an amount of tokens, in an value as close as possible to $5        
      
      await calcBurnVariables(minAmountBurning, accNow, false); // this returns fee not value
            
      //console.log(`burnReturnTotalInUSDCcentsShouldBeNowGlobalV:`, burnReturnTotalInUSDCcentsShouldBeNowGlobalV); 

      if (burnReturnStillInclFeesInUSDCcentsGlobalV >= 500) {
        console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} BURNS this many tokens:`, minAmountBurning);        
       
        await testBurning(`operation nr: ${loopCounter}, burning`, minAmountBurning, accNow, accNow);
        
        totalReturnedInCents += burnReturnTotalInUSDCcentsWasPaidNowGlobalV + burnFeeInUSDCcentsWasPaidNowGlobalV;
        burnCounter++;
      }
            
    }    
    
  }
  
  loopCounterTotal += loopCounter-1;
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;
  
  console.log(`test ran ${loopCounterTotal} loops so far, of which ${mintCounterTotal} were mints and ${burnCounterTotal} were burns. ${not5USDCworthCounter} time(s), less than $5 of tokens existed`); 
  console.log(`so far, roughly ${totalSpentInCents/100} USDC were spent by the testusers (excl. deployer) and ${totalReturnedInCents/100} USDC were paid out by the contract in total`);   

  const protocolBalanceAfterTestInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)) );
  
  const feeReceiverUSDCbalAfterTestsInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonUSDC.balanceOf(feeReceiver)) );
  
  const endTokenBalance = bigNumberToNumber(await benjaminsContract.totalSupply() );
  console.log('at the end of all loops so far, this many tokens exist:', endTokenBalance);  

  if (endTokenBalance >= 2000){
    const valueBNJIsExistingInCents = dividefrom6decToUSDCcents(await benjaminsContract.quoteUSDC(endTokenBalance, false));
    console.log(valueBNJIsExistingInCents/100, `if all these tokens were burnt, they would be worth this much USDC, before fees (to take off)`);
  } else {
    console.log(`if all these tokens were burnt, they would be worth less than $5, before fees (to take off)`);
  }
  
  console.log(protocolUSDCbalWithoutInteresInCentsGlobalV/100, 'protocol should have this many (am)USDC, without interest so far');
  console.log(protocolBalanceAfterTestInCents/100, 'protocol has this many funds in amUSDC, incl interest so far');  
  console.log(feeReceiverUSDCbalAfterTestsInCents/100, `feeReceiver's USDC balance at the end of all loops so far`);
  
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

    await storeAddr();   
    
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
          
    await whaleSigner.sendTransaction({
      to: deployer,
      value: ethers.utils.parseEther("5000000") // 5,000,000 Matic
    })

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });    
           
    polygonWMATIC = new ethers.Contract(
      polygonWMATICaddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function deposit() public payable',            
      ], 
      deployerSigner
    );      
    
    await polygonWMATIC.deposit( {value: ethers.utils.parseEther("4000000")} );

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
   
  
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    //await countAllCents();
    //waitFor(4000);

    //await testMinting("First Setup mint for 100k USDC", 282840, deployer, deployer);    
        
    for (let index = 0; index < 10; index++) {
      const testUserAddress = testUserAddressesArray[index];      
       
      await deployerSigner.sendTransaction({
        to: testUserAddress,
        value: ethers.utils.parseEther("10") // 10 Matic
      })

      await polygonUSDC.connect(deployerSigner).transfer(testUserAddress, (200000*scale6dec) );      
          
    } 
    
  })      

  it("Preparation and verification: ", async function () {    
    
    // confirming: each of the 10 test users has 200k USDC, 10 Matic and 0 BNJI
    await countAllCents();
    waitFor(4000);
    await checkTestAddresses(200000,10,0, true);
    
    // Preparation: testUser1 buys to highest level, from there on will interact in smallest way possible
    //await testMinting("Preparation mint by testUser_1 to get to account level 5", 5000, testUser_1, testUser_1); 

    //console.log(await balUSDC(deployer), 'deployer USDC at start');
    //console.log(divideFrom6decToUSDC(bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address))), 'benjaminsContract amUSDC at start');
    //console.log(await balUSDC(feeReceiver), 'feeReceiver USDC at start');    
    
  });
  
  
  it("1.: Small amount test: 100 mints", async function () {  
      
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 1');
    await countAllCents();    
    waitFor(4000);
  });
  
  it("2.: Small amount test: 100 burns", async function () {     
    
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 2');
    await countAllCents();
    waitFor(4000);

  });
  /*
  it("3.: Small amount test: 100 mints", async function () {     
    let accOrderArray3  = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, true, accOrderArray3, 'Test 3');
    await countAllCents();    
    waitFor(4000);
  });
  
  it("4.: Small amounts test: 100 burns", async function () {     
    let accOrderArray4 = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, false, accOrderArray4, 'Test 4');
    await countAllCents();
    waitFor(4000);
  });
  
  it("5.: Small amounts test: 100 mints", async function () {     
    let accOrderArray5  = [1,1,1,1,1,1,1,1,1,1];    
    await runMintOrBurnLoop(100, true, accOrderArray5, 'Test 5');
    await countAllCents();    
    waitFor(4000);
  });
  
  it("6.: Small amounts test: 100 burns", async function () { 
    let accOrderArray6 = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, false, accOrderArray6, 'Test 6');
    await countAllCents();
    waitFor(4000);
  });

  it("7.: Small amounts test: 100 mints", async function () {     
    let accOrderArray7 = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, true, accOrderArray7, 'Test 7');
    await countAllCents();    
    waitFor(4000);
  });
  
  it("8.: Small amounts test: 100 burns", async function () {     
    let accOrderArray8 = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, false, accOrderArray8, 'Test 8');
    await countAllCents();
    waitFor(4000);
  });

  it("9.: Small amounts test: 100 mints", async function () {     
    let accOrderArray9 = [1,1,1,1,1,1,1,1,1,1];    
    await runMintOrBurnLoop(100, true, accOrderArray9, 'Test 9');
    await countAllCents();    
    waitFor(4000);
  });
  
  it("10.: Small amounts test: 100 burns", async function () {     
    let accOrderArray10 = [1,1,1,1,1,1,1,1,1,1];  
    await runMintOrBurnLoop(100, false, accOrderArray10, 'Test 10');
    await countAllCents();
    waitFor(4000);
  });// */
  
}); 
