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

let protocolUSDCbalWithoutInterestInCentsGlobalV = 0;
let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;
let not5USDCworthCounter = 0;

let totalSpentInCents = 0;
let totalReturnedInCents = 0;
let totalUSDCcentsInTestAccs = 0;

let totalUSDCcentsEntriesArr = [];

const scale6dec = 1000000;

const baseFee = 1;
const levelDiscountsArray = [ 0, 5,  10,  20,  40,   75]; 

let benjaminsContract;

let polygonUSDC;
const polygonUSDCaddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

let polygonWMATIC;
const polygonWMATICaddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

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

async function showReserveInCents(){
  const reserveInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await benjaminsContract.getReserveIn6dec()));
  console.log(reserveInCents, 'contract tracker shows this amount in USDC cents as reserve');
  return reserveInCents;
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

  const callingAccUSDCBalanceBeforeMintInCents = await balUSDCinCents(callingAccAddress);  
  const feeReceiverUSDCBalanceBeforeMintInCents = await balUSDCinCents(feeReceiver); 
  
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
  
  const callingAccUSDCBalanceAfterMintInCents = await balUSDCinCents(callingAccAddress);   
  const feeReceiverUSDCBalanceAfterMintInCents = await balUSDCinCents(feeReceiver);   

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     

  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds received by the protocol, from the user
  const againstInterestDistortionInCents = callingAccMintPricePaidInCents - feeReceiverUSDCdiffMintInCents;
  protocolUSDCbalWithoutInterestInCentsGlobalV += againstInterestDistortionInCents;  
    
  mintPriceTotalInUSDCcentsWasPaidNowGlobalV = callingAccMintPricePaidInCents;
  mintFeeInUSDCcentsWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();
};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) {  

  const receivingAddressUSDCBalanceBeforeBurnInCents = await balUSDCinCents(receivingAddress); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn, callingAccAddress);
  
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);  
 
  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAccUSDCBalanceAfterBurnInCents = await balUSDCinCents(receivingAddress);     
 
  const feeReceiverUSDCBalanceAfterBurnInCents = await balUSDCinCents(feeReceiver);   
  
  const receivingAccBurnReturnReceivedInCents = receivingAccUSDCBalanceAfterBurnInCents - receivingAddressUSDCBalanceBeforeBurnInCents;
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;     

  // since amUSDC amounts change due to interest accrued, transfer amount WITHOUT fees are saved globally for comparison
  // here, transfer amount refers to USDC cents amounts of funds paid out by the protocol, to the user, plus fees, paid by protocol to feeReceiver
  const againstInterestDistortionInCents = receivingAccBurnReturnReceivedInCents + feeReceiverUSDCdiffBurnInCents;
  protocolUSDCbalWithoutInterestInCentsGlobalV -= againstInterestDistortionInCents;

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
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 8000000;
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
  
  
  const burnReturnInUSDC = ( (amountOfTokensBeforeBurn * amountOfTokensBeforeBurn) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 8000000;
  const burnReturnInCents = burnReturnInUSDC * 100;
  const burnReturnRoundedDownInCents = burnReturnInCents - (burnReturnInCents % 1);  
  
  const burnFeeInCentsRoundedDown = getRoundedFee(userLevel, burnReturnRoundedDownInCents); 

  const toReceiveTotalInCents = burnReturnRoundedDownInCents - burnFeeInCentsRoundedDown;
  
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
  
  // reset counter for next round of queries
  totalUSDCcentsInTestAccs = 0;
  return nowUSDCcentsInAllTestAccs;
}

let liquidCentsArray = [];
async function countAllCents() {
  const centsInAllTestUsers = await checkTestAddresses();
  const feeReceiverCents = await balUSDCinCents(feeReceiver); 
  const protocolCents = protocolUSDCbalWithoutInterestInCentsGlobalV;
  const deployerCents = await balUSDCinCents(deployer);

  const allLiquidCents = centsInAllTestUsers + feeReceiverCents + protocolCents + deployerCents;  

  liquidCentsArray.push(allLiquidCents);  

  // verifying that amount of counted cents is always the same
  // starts at second array entry and compares all entries to the one before
  for (let index = 1; index < liquidCentsArray.length; index++) {
    expect(liquidCentsArray[index]).to.equal(liquidCentsArray[index-1]);    
  }

  console.log(`These are the entries each time all liquid USDCcents were counted: `, liquidCentsArray); 
}

async function randomizedMint(callingAcc){

  //  formula for minting for a specified amount of currency (totalPriceForTokensMintingNow) :
  //  totalSupplyAfterMinting = SquareRootOf ( (totalPriceForTokensMintingNow * 8000000) + (totalSupplyBeforeMinting ^2) )
  //  tokenAmountMintingNow = totalSupplyAfterMinting - totalSupplyBeforeMinting

  const balUSDCofCaller = await balUSDC(callingAcc);
  const mintNow = Math.floor(balUSDCofCaller * 0.35);   // this means minting for 35% of their total funds each time
  const totalSupplyExisting = await benjaminsContract.totalSupply();

  const totalSupplyAfterMinting = Math.sqrt((mintNow * 8000000) + (totalSupplyExisting * totalSupplyExisting));

  const tokensMintingNow = totalSupplyAfterMinting - totalSupplyExisting;

  return Math.floor(tokensMintingNow);

}

async function runMintOrBurnLoop(loopsToRun, runMint, accOrderArray, testNr) {
  
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
    
    const accNrNow = accOrderArray[accPosCounter];
    const accNow = testUserAddressesArray[accNrNow];    
    const signerNow = await ethers.provider.getSigner(accNow);
    const accNowName = findUsernameForAddress(accNow);     

    const balUSDCcentsAtStart = await balUSDCinCents(accNow);
    
    const balBNJIatStart = await balBNJI(accNow);
    
    // MINTING
    // if runMint == true, mint. 
    if (runMint == true) {
     
      // local function to check minting amount repeatedly until it's okay
      async function checkMintingAmountOkay() {
        if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 1000 || mintAllowanceInUSDCCentsShouldBeNowGlobalV > balUSDCcentsAtStart) {
          if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 1000) {
            console.log(`RECALC, mint call would be under $10`);  
            randomAmountMinting = Math.floor (Math.random() * 100000); 
          }
          if (mintAllowanceInUSDCCentsShouldBeNowGlobalV > balUSDCcentsAtStart){
            console.log(`RECALC, mint call would be too big for ${accNowName}'s USDC balance`) 
            // halving the randomAmountMinting from before and rounding it down to full integers
            randomAmountMinting = Math.floor(randomAmountMinting* 0.5); 
          }          
          
          console.log('RECALC randomAmountMinting', randomAmountMinting);
          await calcMintApprovalAndPrep(randomAmountMinting, accNow);  // this call will change mintAllowanceInUSDCCentsShouldBeNowGlobalV, so no endless loop
          await checkMintingAmountOkay();         
        } 
      }

      // randomizing amount to mint
      let randomAmountMinting = await randomizedMint(accNow);       
            
      await calcMintApprovalAndPrep(randomAmountMinting, accNow);
      
      await checkMintingAmountOkay(); // checking if amount is okay

      console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} MINTS this many tokens:`, randomAmountMinting);

      mintCounter++;
      
      await testMinting(`operation nr: ${loopCounter}, minting`, randomAmountMinting, accNow, accNow);

      totalSpentInCents += mintAllowanceInUSDCCentsWasNowGlobalV;  

    } 
    
  
    // BURNING
    // if runMint == false, burn.
    else {     
      
      let burnNow = Math.floor (balBNJIatStart * 0.35); // this means burning 35% of their tokens per call      
             
      calcBurnVariables(burnNow, accNow, false); // this returns fee not value

      if(burnReturnStillInclFeesInUSDCcentsGlobalV >= 500) {
        console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} BURNS this many tokens:`, burnNow);        
       
        await testBurning(`operation nr: ${loopCounter}, burning`, burnNow, accNow, accNow);
        
        totalReturnedInCents += burnReturnTotalInUSDCcentsWasPaidNowGlobalV + burnFeeInUSDCcentsWasPaidNowGlobalV;
        burnCounter++;
      } else {
        not5USDCworthCounter += 1
      }
            
    }    
    
  }

  loopCounterTotal += loopCounter-1;
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;

  console.log(`test ran ${loopCounterTotal} loops so far, of which ${mintCounterTotal} were mints and ${burnCounterTotal} were burns. ${not5USDCworthCounter} time(s), less than $5 of tokens existed`); 
  console.log(`estimate: so far, roughly ${totalSpentInCents/100} USDC were spent by the testusers (excl. deployer) and ${totalReturnedInCents/100} USDC were paid out by the contract in total`);   

  const protocolBalanceAfterTestInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)) );
  
  const feeReceiverUSDCbalAfterTestsInCents = dividefrom6decToUSDCcents( bigNumberToNumber (await polygonUSDC.balanceOf(feeReceiver)) );
  
  const endTokenBalance = bigNumberToNumber(await benjaminsContract.totalSupply() );
  const valueBNJIexistingInCents = dividefrom6decToUSDCcents(await benjaminsContract.quoteUSDC(endTokenBalance, false));

  console.log('at the end of all loops so far, this many tokens exist:', endTokenBalance);  
  if (endTokenBalance>0) {console.log(valueBNJIexistingInCents/100, `if all these tokens were burnt, they would be worth this much USDC, before fees (to take off)`)};
  console.log(protocolUSDCbalWithoutInterestInCentsGlobalV/100, 'protocol should have this many (am)USDC, without interest so far');
  const reserveTracked = await showReserveInCents();
  expect(reserveTracked).to.equal(protocolUSDCbalWithoutInterestInCentsGlobalV); 
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
      value: ethers.utils.parseEther("5201000") // 5,001,000 Matic
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
        'function balanceOf(address account) external view returns (uint256)',
        'function deposit() public payable',            
      ], 
      deployerSigner
    );      
    
    await polygonWMATIC.connect(deployerSigner).deposit( {value: ethers.utils.parseEther("5200000")} );

    const balWMATIC = bigNumberToNumber(await polygonWMATIC.connect(deployerSigner).balanceOf(deployer));
    console.log(balWMATIC, "balWMATIC");

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
    
    //function approve(address spender, uint value) external returns (bool);
    await polygonWMATIC.connect(deployerSigner).approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("82000000000") );

    //function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)
    const amountToReceiveUSDCIn6dec = 4210000 * (10**6);
    const amountInMaxInWEI = ethers.utils.parseEther("6000000"); //82000000 * (10**18);   
    await polygonQuickswapRouter.connect(deployerSigner).swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
   
  
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    await countAllCents();
    waitFor(4000);

    console.log(await balUSDCinCents(feeReceiver), "feeReceiver bal in Cents, 1");
    console.log(await balUSDCinCents(deployer), "deployer bal in Cents, 1");
    console.log(protocolUSDCbalWithoutInterestInCentsGlobalV, "protocol bal in Cents, 1");    
    await showReserveInCents();

    await testMinting("First Setup mint for 100k USDC", 889000, deployer, deployer);   
    
    console.log(await balUSDCinCents(feeReceiver), "feeReceiver bal in Cents, 2");
    console.log(await balUSDCinCents(deployer), "deployer bal in Cents, 2");
    console.log(protocolUSDCbalWithoutInterestInCentsGlobalV, "protocol bal in Cents, 2");    
    await showReserveInCents();
        
    for (let index = 0; index < 10; index++) {
      const testUserAddress = testUserAddressesArray[index];      
       
      await deployerSigner.sendTransaction({
        to: testUserAddress,
        value: ethers.utils.parseEther("10") // 10 Matic
      })

      await polygonUSDC.connect(deployerSigner).transfer(testUserAddress, (400000*scale6dec) );      
          
    }     
    
  })      

  it("Preparation verification: each of the 10 test users has 400k USDC, 10 Matic and 0 BNJI", async function () {    
        
    await countAllCents();
    waitFor(4000);
    await checkTestAddresses(400000,10,0, true);
    
  });
  
  
  it("1.: Large amounts test: 100 mints", async function () {     
    let accOrderArray1 = [9,8,7,6,5,4,3,2,1,0];      
    await runMintOrBurnLoop(100, true, accOrderArray1, 'Test 1');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });
  
  it("2.: Large amounts test: 100 burns", async function () {     
    let accOrderArray2 = [0,8,3,6,5,1,7,2,4,9];  
    await runMintOrBurnLoop(100, false, accOrderArray2, 'Test 2');
    await countAllCents();
    waitFor(4000);

  });
  
  it("3.: Large amounts test: 100 mints", async function () {     
    let accOrderArray3 = [5,8,3,6,8,1,7,2,4,0];  
    await runMintOrBurnLoop(100, true, accOrderArray3, 'Test 3');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });
  
  it("4.: Large amounts test: 100 burns", async function () {     
    let accOrderArray4 = [0,8,9,6,7,5,1,4,2,3];  
    await runMintOrBurnLoop(100, false, accOrderArray4, 'Test 4');
    await countAllCents();
    waitFor(4000);
  });
  
  it("5.: Large amounts test: 100 mints", async function () {     
    let accOrderArray5 = [1,8,3,6,7,5,0,4,2,9];    
    await runMintOrBurnLoop(100, true, accOrderArray5, 'Test 5');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });
  
  it("6.: Large amounts test: 100 burns", async function () { 
    let accOrderArray6 = [0,9,3,6,5,7,1,2,4,8];  
    await runMintOrBurnLoop(100, false, accOrderArray6, 'Test 6');
    await countAllCents();    
    waitFor(4000);
  });

  it("7.: Large amounts test: 100 mints", async function () {     
    let accOrderArray7 = [6,8,1,4,5,9,3,2,7,0];  
    await runMintOrBurnLoop(100, true, accOrderArray7, 'Test 7');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });
  
  it("8.: Large amounts test: 100 burns", async function () {     
    let accOrderArray8 = [0,8,1,7,2,9,3,5,4,6];  
    await runMintOrBurnLoop(100, false, accOrderArray8, 'Test 8');
    await countAllCents();    
    waitFor(4000);
  });

  it("9.: Large amounts test: 100 mints", async function () {     
    let accOrderArray9 = [9,8,1,6,3,0,2,5,4,7];    
    await runMintOrBurnLoop(100, true, accOrderArray9, 'Test 9');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });
  
  it("10.: Large amounts test: 100 burns", async function () {     
    let accOrderArray10 = [3,2,0,6,4,9,7,8,5,1];  
    await runMintOrBurnLoop(100, false, accOrderArray10, 'Test 10');
    await countAllCents();
    waitFor(4000);
  });

  it("11.: Large amounts test: 100 mints", async function () {     
    let accOrderArray9 = [4,8,2,6,3,7,0,5,9,1];    
    await runMintOrBurnLoop(100, true, accOrderArray9, 'Test 11');
    await countAllCents();    
    await mintBlocks(720);
    waitFor(4000);
  });//*/

  it("Test 12. All tokens that exist can be burned, and the connected USDC paid out by the protocol", async function () { 

    // deployer deposits $1 extra
    //await depositAdditionalUSDC(1*scale6dec);   
    
    await mintBlocks(720);
    
    for (let index = 0; index < testUserAddressesArray.length; index++) {
      const callingAcc = testUserAddressesArray[index];

      const balanceBNJI = await balBNJI(callingAcc);      

      if (balanceBNJI>0){
        await testBurning(`Endburn from testUser_${index}`, balanceBNJI, callingAcc, callingAcc);
        expect(await balBNJI(callingAcc)).to.equal(0);
      }    
    }

    const balBNJIdeployer = await balBNJI(deployer);
    await testBurning(`Endburn from deployer`, balBNJIdeployer, deployer, deployer);

    expect(await balBNJI(deployer)).to.equal(0);

    const totalSupplyExistingAtEnd = bigNumberToNumber(await benjaminsContract.totalSupply()); 
    expect(totalSupplyExistingAtEnd).to.equal(0);

    await showReserveInCents();

    console.log(await balUSDCinCents(feeReceiver), "feeReceiver bal in Cents, end");
    console.log(await balUSDCinCents(deployer), "deployer bal in Cents, end");

    console.log(dividefrom6decToUSDCcents(bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address))), 'benjaminsContract amUSDC at end in cents');
  });
}); 
