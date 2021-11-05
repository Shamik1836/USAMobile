const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

// global variables for comparisons
// the "should" versions are calculations, the "was" versions are queried responses
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

// variables to track
let burnReturnStillInclFeesInUSDCcentsGlobalV = 0;

// variable to help track the protocol's USDC balance value, which is actually existing as
// an amUSDC balance, which is difficult to track, since it constantly accrues interest via Aave's lendingPool
// this variable is calculated at first, and constantly compared to the variable reserveTracked,
// which queries the benjaminsContract's reserveInUSDCin6dec variable
let protocolUSDCbalWithoutInterestInCentsGlobalV = 0;

// counters to keep track of variables in runMintOrBurnLoop
// namely: loops, mints, burns and sub-5-dollar values of total supply
let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;
let not5USDCworthCounter = 0;

// estimates of USDC cents spent and returned during runMintOrBurnLoop
let totalSpentInCents = 0;
let totalReturnedInCents = 0;

// used by checkTestAddresses function
// tracking all USDC cents in testUSer_1, the arrays stores each snapshot
let totalUSDCcentsInTestAccs = 0;
let totalUSDCcentsInTestAccArr = [];

const scale6dec = 1000000;

const baseFee = 2; 
const levelDiscountsArray = [ 0, 5,  10,  20,  40,   75]; 

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

let testUserAddressesArray = [];

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

async function balBNJI(userToQuery) {
  return bigNumberToNumber (await benjaminsContract.balanceOf(userToQuery));
}

async function showReserveInCents(){
  const reserveInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await benjaminsContract.showReserveIn6dec()));
  console.log(reserveInCents, 'contract tracker shows this amount in USDC cents as reserve');
  return reserveInCents;
}

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = Number ((ethers.utils.formatUnits(bignumber, 0)).toString());  
  return convertedNumber;
}

// converting from 6dec to USDC cents
function dividefrom6decToUSDCcents (largeNumber) {
  const numberInUSDC = Number( largeNumber / (10**4) );      
  return numberInUSDC;    
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

async function testMinting(amountToMint, callingAccAddress, receivingAddress) {
    
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

async function testBurning(amountToBurn, callingAccAddress, receivingAddress) { 

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

  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountMinting));  
 
  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 800000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostRoundedDownInCents = mintingCostInCents - (mintingCostInCents % 1);

  const mintFeeInCentsRoundedDown = getRoundedFee(userLevel, mintingCostRoundedDownInCents);  
  
  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostRoundedDownInCents + mintFeeInCentsRoundedDown; 
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
 
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountBurning));   
  
  const burnReturnInUSDC = ( (amountOfTokensBeforeBurn * amountOfTokensBeforeBurn) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 800000;
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
  testUserAddressesArray.push(testUser_1);  
}

// checking balances and adding them up
async function checkTestAddresses(amountUSDC, amountMatic, amountBNJI, expectBool){  
  const testUserAddress = testUser_1;  
  const testAccUSDCcentsbal = await balUSDCinCents(testUserAddress);
  const testAccMATICbal = await getMaticBalance(testUserAddress);
  const testAccBNJIbal = await balBNJI(testUserAddress);

  // if arg 'expectBool' was sent in as true, verify preparation did work as expected
  if (expectBool == true){       
    expect(testAccUSDCcentsbal).to.equal(amountUSDC*100);
    expect(testAccMATICbal).to.equal(amountMatic);
    expect(testAccBNJIbal).to.equal(amountBNJI);
  }  

  // adding each account's amount of USDCcents onto the counter
  totalUSDCcentsInTestAccs += testAccUSDCcentsbal;    
  
  // nowUSDCcentsInAllTestAccs is a local variable to return content of totalUSDCcentsInTestAccs
  // since that variable is reset before the return
  let nowUSDCcentsInAllTestAccs = totalUSDCcentsInTestAccs;

  // keeping log of all USDCcents found in testaccounts, saving each round of queries as snapshot to totalUSDCcentsInTestAccArr
  totalUSDCcentsInTestAccArr.push(totalUSDCcentsInTestAccs);  
 
  console.log(`These are the entries each time testUser_1's USDCcents were counted: `, totalUSDCcentsInTestAccArr);

  // resetting counter for next round of queries
  totalUSDCcentsInTestAccs = 0;
  return nowUSDCcentsInAllTestAccs;
}

let liquidCentsArray = [];
async function countAllCents() {
  const centsInTestUser_1 = await balUSDCinCents(testUser_1);
  const feeReceiverCents = await balUSDCinCents(feeReceiver); 

  const protocolCents = protocolUSDCbalWithoutInterestInCentsGlobalV;  

  const allLiquidCents = centsInTestUser_1 + feeReceiverCents + protocolCents;  

  liquidCentsArray.push(allLiquidCents);  

  // verifying that amount of counted cents is always the same
  // starts at second array entry and compares all entries to the one before
  for (let index = 1; index < liquidCentsArray.length; index++) {
    expect(liquidCentsArray[index]).to.equal(liquidCentsArray[index-1]);    
  }

  console.log(`These are the entries each time all USDCcents were counted, liquidCentsArray: `, liquidCentsArray); 
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

async function runMintOrBurnLoop(loopsToRun, runMint, accNow, testNr, sellAll, burnLoopToSellAll) {
  
  let mintCounter = 0;
  let burnCounter = 0;  

  // running either minting or burning, this many loops: loopsToRun
  for (loopCounter = 1; loopCounter <= loopsToRun; loopCounter++) {
         
    const accNowName = findUsernameForAddress(accNow);     
    
    // MINTING
    // if runMint == true, mint. 
    if (runMint == true) {
      
      // randomizing amount to mint
      let minAmountMinting = await minimizedMint();       
            
      await calcMintApprovalAndPrep(minAmountMinting, accNow);    

      console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} MINTS this many tokens:`, minAmountMinting);

      mintCounter++;
      
      await testMinting(minAmountMinting, accNow, accNow);

      totalSpentInCents += mintAllowanceInUSDCCentsWasNowGlobalV;  

    }   
      
    // BURNING
    // if runMint == false, burn.
    else {   
      let minAmountBurning = await minimizedBurn(); // this means burning an amount of tokens, in an value as close as possible to $5  
      
      if (sellAll == true && burnLoopToSellAll == loopCounter) {
        minAmountBurning = await balBNJI(testUser_1);
      }
      
      await calcBurnVariables(minAmountBurning, accNow, false); // this returns fee not value     

      if (burnReturnStillInclFeesInUSDCcentsGlobalV >= 500) {
        console.log(`In ${testNr}, operation nr: ${loopCounter} ${accNowName} BURNS this many tokens:`, minAmountBurning);        
       
        await testBurning(minAmountBurning, accNow, accNow);
        
        totalReturnedInCents += burnReturnTotalInUSDCcentsWasPaidNowGlobalV + burnFeeInUSDCcentsWasPaidNowGlobalV;
        burnCounter++;
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
  console.log('at the end of all loops so far, this many tokens exist:', endTokenBalance);  

  if (endTokenBalance >= 2000){
    const valueBNJIsExistingInCents = dividefrom6decToUSDCcents(await benjaminsContract.quoteUSDC(endTokenBalance, false));
    console.log(valueBNJIsExistingInCents/100, `if all these tokens were burnt, they would be worth this much USDC, before fees (to take off)`);
  } else {
    console.log(`if all these tokens were burnt, they would be worth less than $5, before fees (to take off)`);
  }
  
  console.log(protocolUSDCbalWithoutInterestInCentsGlobalV/100, 'protocol should have this many (am)USDC, without interest so far');
  console.log(protocolBalanceAfterTestInCents/100, 'protocol has this many funds in amUSDC, incl interest so far');  
  console.log(feeReceiverUSDCbalAfterTestsInCents/100, `feeReceiver's USDC balance at the end of all loops so far`);
  const reserveTracked = await showReserveInCents();
  expect(reserveTracked).to.equal(protocolUSDCbalWithoutInterestInCentsGlobalV); 
} 


// This series of tests is simulating a situation where a user tries to drain the protocol via its rounding mechanisms.
// testUser_1 will get the highest account level for maximum discounts and then mint and burn the minimum amounts of tokens possible,
// trying to get the protocol to lose funds by rounding away the fees it is collecting (since sub-cent values are rounded down).
// The tests show that even such an unrealistic situation would not drain the protocol.
describe("Small Amounts Test", function () {

  // setting instances of contracts
  before(async function() {   

    ({deployer, 
    feeReceiver, 
    accumulatedReceiver,    
    testUser_1
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
       
    await deployerSigner.sendTransaction({
      to: testUser_1,
      value: ethers.utils.parseEther("10") // 10 Matic
    })

    await polygonUSDC.connect(deployerSigner).transfer(testUser_1, (200000*scale6dec) );      
  })      

  it("Preparation and verification: ", async function () {    
    
    // taking snapshot of all USDC cents in the accounts of testUser_1, feeReceiver and benjaminsContract
    await countAllCents();
    waitFor(4000);

    // confirming: testUser_1 has 200k USDC, 10 Matic and 0 BNJI
    await checkTestAddresses(200000,10,0, true);
    
    // Preparation: testUser1 buys to highest level, from there on will interact in smallest way possible
    await testMinting(5000, testUser_1, testUser_1);  

    expect(await benjaminsContract.discountLevel(testUser_1)).to.equal(5);
       
    // user waits for blocks to pass, so that he can burn his tokens
    mintBlocks(720);
    
  });  
  
  it("1.: Small amount test: 100 mints", async function () {        
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 1', false, 0);
    await countAllCents();    
    waitFor(4000);
  });
  
  it("2.: Small amount test: 100 burns", async function () {    
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 2', false, 0);    
    await countAllCents();    
    waitFor(4000);
  });
  
  /*
  it("3.: Small amount test: 100 mints", async function () {
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 3', false, 0);
    await countAllCents();    
    waitFor(4000);
  });
  
  it("4.: Small amounts test: 100 burns", async function () { 
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 4', false, 0);
    await countAllCents();
    waitFor(4000);
  });
  
  it("5.: Small amounts test: 100 mints", async function () {     
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 5', false, 0);
    await countAllCents();    
    waitFor(4000);
  });
  
  it("6.: Small amounts test: 100 burns", async function () { 
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 6', false, 0);
    await countAllCents();
    waitFor(4000);
  });

  it("7.: Small amounts test: 100 mints", async function () {  
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 7', false, 0);
    await countAllCents();    
    waitFor(4000);
  });
  
  it("8.: Small amounts test: 100 burns", async function () {       
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 8', false, 0);
    await countAllCents();
    waitFor(4000);
  });

  it("9.: Small amounts test: 100 mints", async function () {         
    await runMintOrBurnLoop(100, true, testUser_1, 'Test 9', false, 0);
    await countAllCents();    
    waitFor(4000);
  });
  
  it("10.: Small amounts test: 100 burns", async function () {  
    await runMintOrBurnLoop(100, false, testUser_1, 'Test 10', true, 100);
    await countAllCents();
    expect(await benjaminsContract.discountLevel(testUser_1)).to.equal(0);
    console.log((await balUSDCinCents(testUser_1)/100), 'end balance of testUser_1 in USDC');
    
  });// */  
}); 