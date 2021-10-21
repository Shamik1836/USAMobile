const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
//let burnReturnTotalInUSDCShouldBeNowGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
//let burnReturnTotalInUSDCWasPaidNowGlobalV;

const scale6dec = 1000000;

let testingUserAddressesArray = [];
const levelDiscountsArray = [ 0, 5,  10,  20,  40,   75];
const levelAntesArray = [ 0, 20, 60, 100, 500, 2000];

let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let totalSpent = 0;
let totalReturned = 0;

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

let testUser_1_Signer;
let testUser_2_Signer;

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

async function addUserAccDataPoints(userToCheck){
  const userLevelNow = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(userToCheck));
  const userDiscountNow = bigNumberToNumber (await benjaminsContract.calcDiscount(userToCheck)); 
  
  if (userToCheck == testUser_1){
    user1LevelDataArray.push(userLevelNow);
    user1DiscountDataArray.push(userDiscountNow);
  } else if (userToCheck == testUser_2) {
    user2LevelDataArray.push(userLevelNow);
    user2DiscountDataArray.push(userDiscountNow);

  } else {
    console.log("addUserAccDataPoints: user account not set up for data points!")
  }
}

function confirmUserDataPoints(userToCheck, expectedUserLevelsArray, expectedUserDiscountArray) {
  if  (userToCheck == testUser_1){
    for (let index = 0; index < user1LevelDataArray.length; index++) {
      expect(expectedUserLevelsArray[index]).to.equal(user1LevelDataArray[index]); 
      expect(expectedUserDiscountArray[index]).to.equal(user1DiscountDataArray[index]);
    }
  } else if (userToCheck == testUser_2) {

    for (let index = 0; index < user2LevelDataArray.length; index++) {
      expect(expectedUserLevelsArray[index]).to.equal(user2LevelDataArray[index]); 
      expect(expectedUserDiscountArray[index]).to.equal(user2DiscountDataArray[index]);
    }
  }
}

// simulate the passing of blocks
async function mintBlocks (amountOfBlocksToMint) {
  for (let i = 0; i < amountOfBlocksToMint; i++) {
    await ethers.provider.send("evm_mine");
  }
}

async function balUSDC(userToQuery) {
  return divideFrom6decToUSDC(bigNumberToNumber (await polygonUSDC.balanceOf(userToQuery)));
}

async function balBNJI(userToQuery) {
  return bigNumberToNumber (await benjaminsContract.balanceOf(userToQuery));
}

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = Number ((ethers.utils.formatUnits(bignumber, 0)).toString());  
  return convertedNumber;
}

// converting WEI to ETH
function fromWEItoETH18dig (numberInWEI) {
  const numberInUSDC = Number( numberInWEI / (10**18) );      
  return numberInUSDC;    
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
  console.log("User is holding his BNJI this many blocks so far:", bigNumberToNumber( blockResponseObject.blocksHoldingSoFar));
  console.log("This many blocks are needed for user to unlock:", bigNumberToNumber( blockResponseObject.blocksNecessaryTotal));
}





async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

  console.log('calling address in testMinting is now:', callingAccAddress);
 
  const totalSupplyBeforeMint = bigNumberToNumber( await benjaminsContract.totalSupply()); 

  const receivingAddressBNJIbalBeforeMint = bigNumberToNumber(await benjaminsContract.balanceOf(receivingAddress));
  const contractBNJIbalBefore = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const callingAccUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress)));  
  const feeReceiverUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiver))); 

  const contractAMUSDCbalanceBeforeMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));


  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);  
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint, callingAccAddress);
  console.log(bigNumberToNumber(amountToApproveIn6dec), 'amountToApproveIn6dec in testMinting', );  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);

  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  //console.log(bigNumberToNumber(givenAllowanceToBNJIcontract), `givenAllowanceToBNJIcontract in testMinting by ${callingAccAddress}` ); 

  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
  
  // descr: function mintTo(uint256 _amount, address _toWhom) public whenAvailable {  
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  console.log(`${callingAccAddress} is minting this many tokens:`, amountToMint, 'for:', receivingAddress );

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAddressBNJIbalAfterMint = bigNumberToNumber(await benjaminsContract.balanceOf(receivingAddress));
  const contractBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const callingAccUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress)));   
  const feeReceiverUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiver))); 

  const contractAMUSDCbalanceAfterMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));  

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  const contractAMUSDCdiffMintInCents = contractAMUSDCbalanceAfterMintInCents - contractAMUSDCbalanceBeforeMintInCents;
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeMintInCents), `benjaminsContract amUSDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterMintInCents), `benjaminsContract amUSDC balance after ${mintName}`);

  console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents), `${callingAccAddress} USDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents), `${callingAccAddress} USDC balance after ${mintName}`);    

  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeMintInCents), `feeReceiver USDC balance before ${mintName}`);
  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterMintInCents), `feeReceiver USDC balance after ${mintName}`);
  
  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents), `${callingAccAddress} mint price paid in USDC`);
  console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `approx. of what benjaminsContract received in amUSDC (incl. interest already accrued)`);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver mint fee received in USDC:`);  
  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents - contractAMUSDCdiffMintInCents), `approx. of what should be the fee received, in USDC (difference between paid by user and received by protocol, changed by interest already accrued)`); 

  console.log(totalSupplyBeforeMint, `Benjamins total supply before minting ${amountToMint} Benjamins`); 
  console.log(totalSupplyAfterMint, `Benjamins total supply after minting ${amountToMint} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${mintName}`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after${mintName}`);

  console.log(receivingAddressBNJIbalBeforeMint, `receivingAddress owns/manages this many benjamins before ${mintName}`);
  console.log(receivingAddressBNJIbalAfterMint, `receivingAddress owns/manages this many benjamins after ${mintName}`);

  
  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  console.log(`==============================================================================`);
  console.log(`==============================================================================`);

};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) { 

  console.log('calling address in testBurning is now:', callingAccAddress);
 
  const totalSupplyBeforeBurn = bigNumberToNumber( await benjaminsContract.totalSupply() );

  const callingAddressBNJIbalBeforeBurn = bigNumberToNumber(await benjaminsContract.balanceOf(callingAccAddress));
  const contractBNJIbalBefore = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const receivingAddressUSDCBalanceBeforeBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(receivingAddress))); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiver))); 
  
  const contractAMUSDCbalanceBeforeBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  


  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn, callingAccAddress);

  // descr: function burnTo(uint256 _amount, address _toWhom)
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);  
  
  console.log(`${callingAccAddress} is burning this many tokens:`, amountToBurn, 'for:', receivingAddress );

  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAccUSDCBalanceAfterBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(receivingAddress))); 
  
  
  const callingAccBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(callingAccAddress)); 
  const feeReceiverUSDCBalanceAfterBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiver))); 
  
  const contractAMUSDCbalanceAfterBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  
  const contractBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const receivingAccBurnReturnReceivedInCents = receivingAccUSDCBalanceAfterBurnInCents - receivingAddressUSDCBalanceBeforeBurnInCents;
  const contractAMUSDCdiffBurnInCents = contractAMUSDCbalanceBeforeBurnInCents - contractAMUSDCbalanceAfterBurnInCents ;
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;     
  
  //const burningAccBNJIdifference = callingAddressBNJIbalBeforeBurn - callingAccBNJIbalAfter;
  
  console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeBurnInCents), `benjaminsContract amUSDC balance before ${burnName}`);
  console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterBurnInCents), `benjaminsContract amUSDC balance after ${burnName}`);

  console.log(fromCentsToUSDC(callingAddressBNJIbalBeforeBurn), `${callingAccAddress} BNJI balance before ${burnName}`);
  console.log(fromCentsToUSDC(callingAccBNJIbalAfter), `${callingAccAddress} BNJI balance after ${burnName}`);    

  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeBurnInCents), `feeReceiver USDC balance before ${burnName}`);
  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterBurnInCents), `feeReceiver USDC balance after ${burnName}`);
  
  console.log(fromCentsToUSDC(receivingAccBurnReturnReceivedInCents), `${callingAccAddress} burn return received in USDC`);
  console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents), `approx. of what benjaminsContract paid out in amUSDC (incl. interest already accrued) `);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffBurnInCents), `feeReceiver burn fee received in USDC:`);  
  console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents - receivingAccBurnReturnReceivedInCents), `approx. of what should be the fee received, in USDC (difference between received by user and paid by protocol, changed by interest already accrued)`); 

  console.log(totalSupplyBeforeBurn, `Benjamins total supply before burning ${amountToBurn} Benjamins`); 
  console.log(totalSupplyAfterBurn, `Benjamins total supply after burning ${amountToBurn} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${burnName}`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${burnName}`);

  
  console.log(`Benjamin total supply after, burning ${amountToBurn} tokens:`, totalSupplyAfterBurn); 

  //burnReturnTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(contractAMUSDCdiffBurnInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  console.log(`==============================================================================`);
  console.log(`==============================================================================`);

};

function confirmMint(){  
  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
};

function confirmBurn(){  
  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  //expect(burnReturnTotalInUSDCShouldBeNowGlobalV).to.equal(Number(burnReturnTotalInUSDCWasPaidNowGlobalV));
};

async function calcMintApprovalAndPrep(amountToMint, accountMinting) {  
  
  const amountOfTokensBeforeMint = bigNumberToNumber(await benjaminsContract.totalSupply());
  const amountOfTokensAfterMint = Number (amountOfTokensBeforeMint) + Number (amountToMint);

  const usersTokenAtStart = bigNumberToNumber(await benjaminsContract.balanceOf(accountMinting));
  const userLevel = bigNumberToNumber (await benjaminsContract.discountLevel(accountMinting)); 
  
  // starting with minting costs, then rounding down to cents
  const mintingCostinUSDC = ((amountOfTokensAfterMint * amountOfTokensAfterMint) - (amountOfTokensBeforeMint * amountOfTokensBeforeMint)) / 800000;
  const mintingCostInCents = mintingCostinUSDC * 100;
  const mintingCostInCentsRoundedDown = mintingCostInCents - (mintingCostInCents % 1);

  // getting accounts' feeModifier and starting with calculated fee, then rounding down to cents
  // descr.: quoteFeePercentage(address forWhom, int256 amount)  
  const feeModifier = 100 - bigNumberToNumber(await benjaminsContract.quoteFeePercentage(accountMinting));  
  const mintFeeStarterInCents = ((mintingCostInCents * feeModifier ) /100) / 100;   // TODO: needs to change, reply will come in different format
  const mintFeeInCentsRoundedDown = mintFeeStarterInCents - (mintFeeStarterInCents % 1);

  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostInCentsRoundedDown + mintFeeInCentsRoundedDown;
  const toPayTotalInUSDC = toPayTotalInCents / 100;
  const toPayTotalIn6dec = toPayTotalInCents * 10000;    

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCShouldBeNowGlobalV = toPayTotalInUSDC;
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = toPayTotalInCents;  

  console.log(usersTokenAtStart, "this was the users token balance at start, calcMintApprovalAndPrep");  
  console.log(userLevel, "this was the users applied account level, calcMintApprovalAndPrep");
  console.log(feeModifier/100, "this was the fee modifier in percent, calcMintApprovalAndPrep");

  return toPayTotalIn6dec;
}

async function calcBurnVariables(amountToBurn, accountBurning) {

  const amountOfTokensBeforeBurn = bigNumberToNumber(await benjaminsContract.totalSupply());  
  const amountOfTokensAfterBurn = amountOfTokensBeforeBurn - amountToBurn;

  

  const usersTokenAtStart = bigNumberToNumber(await benjaminsContract.balanceOf(accountBurning));
  const userLevel = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(accountBurning)); 
  
  const totalReturnForTokensBurningNowInUSDC = ( (amountOfTokensBeforeBurn * amountOfTokensBeforeBurn) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 800000;
  const totalReturnForTokensBurningNowInCents = totalReturnForTokensBurningNowInUSDC * 100;
  const inCentsRoundedDownBurn = totalReturnForTokensBurningNowInCents - (totalReturnForTokensBurningNowInCents % 1);
  
  
// descr.: quoteFeePercentage(address forWhom, int256 amount)  
  const feeModifier = 100 - bigNumberToNumber(await benjaminsContract.quoteFeePercentage(accountBurning));   
  const burnFeeStarterInCents = ((totalReturnForTokensBurningNowInCents * feeModifier * baseFee) /100 ) /100; // TODO: needs to change, reply will come in different format
  const burnFeeInCentsRoundedDown = burnFeeStarterInCents - (burnFeeStarterInCents % 1);

  const toReceiveTotalInCents = inCentsRoundedDownBurn - burnFeeInCentsRoundedDown;
  const toReceiveTotalInUSDC = toReceiveTotalInCents / 100;
  const toReceiveTotalIn6dec = toReceiveTotalInCents * 10000;

 
  tokensShouldExistNowGlobalV = amountOfTokensAfterBurn;
  burnReturnTotalInUSDCShouldBeNowGlobalV = toReceiveTotalInUSDC;

  console.log("tokensShouldExistNowGlobalV:", tokensShouldExistNowGlobalV );
  console.log("burnReturnTotalInUSDCShouldBeNowGlobalV:", burnReturnTotalInUSDCShouldBeNowGlobalV );

  console.log(usersTokenAtStart, "this is the burning users token balance found at start, calcBurnVariables");  
  console.log(userLevel, "this is the burning users account level found at start, calcBurnVariables");
  console.log(feeModifier/100, "this is the applicable fee modifier in percent found at start, calcBurnVariables");
     
}

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));  









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
    
    polygonLendingPool = new ethers.Contract(
      polygonLendingPoolAddress,
      [
        'function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
      ], 
      deployerSigner
    );  
    
    // after deployment, querying benjamins balance of deployer, logging as number and from WEI to ETH
    const startingBalanceInbenjamins = bigNumberToNumber(await benjaminsContract.balanceOf(deployer));    
    //console.log("deployer owns/controls this many benjamins after deployment: ", startingBalanceInbenjamins);

    // after deployment, querying benjamins total supply
    const totalSupplyAfterDeploy = bigNumberToNumber(await benjaminsContract.totalSupply()) ;
    //console.log("benjamins total supply after deployment: ", totalSupplyAfterDeploy);   

    /*
    // after deployment, checking allowance between BenjaminsContract and LendingPool
    const contractAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(benjaminsContract.address, polygonLendingPool.address)) ;
    const deployerAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(deployer, polygonLendingPool.address)) ;
    console.log("contractAllowanceAfterDeploy: ", contractAllowanceAfterDeploy);   
    console.log("deployerAllowanceAfterDeploy: ", deployerAllowanceAfterDeploy);
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

    const whaleMaticBefore = await getMaticBalance(whaleSignerAddress);
    //console.log('whale has this many MATIC before sending whale transfer:', whaleMaticBefore);   

    const deployerMaticBefore = await getMaticBalance(deployer);
    //console.log('deployer has this many MATIC before getting whale transfer:', deployerMaticBefore);   
      
    await whaleSigner.sendTransaction({
      to: deployer,
      value: ethers.utils.parseEther("5000000") // 5,000,000 Matic
    })

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });    

    const whaleMaticAfter = await getMaticBalance(whaleSignerAddress);
    //console.log('whale has this many MATIC after sending whale transfer:', whaleMaticAfter); 

    const deployerMaticAfter = await getMaticBalance(deployer);
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

      
    //const deployerUSDCbalStart2 = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    //console.log('deployer has this many USDC before using DEX:', deployerUSDCbalStart2);     

    //function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)
    const amountToReceiveUSDCIn6dec = 1000000 * (10**6) //ethers.utils.parseEther("1000000");
    const amountInMaxInWEI = ethers.utils.parseEther("4000000"); //4000000 * (10**18);   
    await polygonQuickswapRouter.swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
   

    //const deployerUSDCbalEnd2 = divideFrom6decToUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    //console.log('deployer has this many USDC after using DEX:', deployerUSDCbalEnd2);             
      
  
    await benjaminsContract.connect(deployerSigner).unpause();  // <====== need to improve pausing and housekeeping functionality XXXXXX

    // args: testMinting(mintName, amountToMint, callingAccAddress, receivingAddress)
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

    await benjaminsContract.connect(deployerSigner).updateBlocksPerDay(2);


    /*
    const testUser_1_MATICbalance = await getMaticBalance(testUser_1);
    const testUser_1_USDCbalance = await polygonUSDC.balanceOf(testUser_1);
    const testUser_1_BNJIbalance = await benjaminsContract.balanceOf(testUser_1) ;

    console.log('testUser_1 is:', testUser_1);
    console.log(`testUser_1 has in Matic:`, testUser_1_MATICbalance);
    console.log(`testUser_1 has in USDC:`, divideFrom6decToUSDC(bigNumberToNumber(testUser_1_USDCbalance)));   
    console.log(`testUser_1 has in BNJI:`, bigNumberToNumber(testUser_1_BNJIbalance));      

    const testUser_2_MATICbalance = await getMaticBalance(testUser_2);
    const testUser_2_USDCbalance = await polygonUSDC.balanceOf(testUser_2);
    const testUser_2_BNJIbalance = await benjaminsContract.balanceOf(testUser_2) ;

    console.log('testUser_2 is:', testUser_2);
    console.log(`testUser_2 has in Matic:`, testUser_2_MATICbalance);
    console.log(`testUser_2 has in USDC:`, divideFrom6decToUSDC(bigNumberToNumber(testUser_2_USDCbalance)));   
    console.log(`testUser_2 has in BNJI:`, bigNumberToNumber(testUser_2_BNJIbalance));      
    */
  })      
  
  /*
  it("Test 1. testUser_1 should mint 10 BNJI for themself", async function () {    
    
    // args: testMinting(mintName, amountToMint, callingAccAddress, receivingAddress)
    await testMinting("Test 1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1) )).to.equal(10);

  });
  
  it("Test 2. testUser_1 should mint 10 BNJI for themself, then do the same again in the next block", async function () { 
    
    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    
    
    await testMinting("Test 2.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();

    await mintBlocks(1);

    const userLevelAfter10 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter10 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    await testMinting("Test 2.2, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1) )).to.equal(20);  

    const userLevelAfter20 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter20 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    
   

    expect(userLevelStart).to.equal(0); 
    expect(userLevelAfter10).to.equal(0); 
    expect(userLevelAfter20).to.equal(1);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter10).to.equal(0);   
    expect(userDiscountAfter20).to.equal(5);
  });
  
  */
  /*
  it("Test 3. Should REVERT: testUser_1 tries to mint token amount that includes decimals", async function () {   

    const callingAccSigner = await ethers.provider.getSigner(testUser_1);  

    await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, 1000*10000);    

    const bn126dot2 = ethers.BigNumber.from(126.2);

    await benjaminsContract.connect(callingAccSigner).mintToBeneficiary(bn126dot2, testUser_1);  

    confirmMint();    
  });  
  */

  /*  
  it("Test 4. Should REVERT: testUser_1 tries to burn tokens before anti flashloan holding period ends", async function () {   

    await testMinting("Test 4.1, minting 20 BNJI to caller", 20, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(20);

    await mintBlocks(5);  
    
    await expect( testBurning("Test 4.2, should REVERT, burning after 5 blocks", 10, testUser_1, testUser_1) ).to.be.revertedWith(
      "BNJ, specifiedAmountBurn: sender is not yet allowed to withdraw/burn"
    );

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(20);

  });  
  */

  /*
  it("Test 5. testUser_1 mints 19 tokens, then burns them after 11 blocks waiting time", async function () {   
    
    await testMinting("Test 5.1, minting 19 BNJI to caller", 19, testUser_1, testUser_1);    
    confirmMint();

    expect(await balBNJI(testUser_1)).to.equal(19);   
    
    await mintBlocks(11);  

    const USDCbeforeBurn = await balUSDC(testUser_1);
    
    await testBurning("Test 5.2, burning after 11 blocks", 19, testUser_1, testUser_1);

    expect(await balBNJI(testUser_1)).to.equal(0);

  });  
  */
  /*
  it("Test 6. Should REVERT: testUser_1 tries to burn more tokens than they have", async function () {   
    
    await testMinting("Test 6.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();

    expect(await balBNJI(testUser_1)).to.equal(10);   
    
    await mintBlocks(11);    

    await expect( testBurning("Test 6.2, should REVERT, burning more BNJIs than user has", 12, testUser_1, testUser_1) ).to.be.revertedWith(
      "BNJ, Users tokenBalance must be equal to or more than amount to burn."
    );

    expect(await balBNJI(testUser_1)).to.equal(10);

  });  
  */
  /*
  it("Test 7. Token price should increase following bonding curve", async function () {   

    await testMinting("Test 7.1, minting 2000 BNJI to caller", 2000, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(2000);
    
    await mintBlocks(1);  
    
    const balanceUSDCbefore1st = await polygonUSDC.balanceOf(testUser_1);    
    await testMinting("Test 7.2, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(2010); 
    const balanceUSDCafter1st = await polygonUSDC.balanceOf(testUser_1);
    const firstPriceForTenInCents = dividefrom6decToUSDCcents(bigNumberToNumber(balanceUSDCbefore1st-balanceUSDCafter1st));        
    
    await mintBlocks(1);    

    await testMinting("Test 7.3, minting 1000 BNJI to caller", 1000, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(3010);

    await mintBlocks(1);    

    const balanceUSDCbefore2nd = await polygonUSDC.balanceOf(testUser_1);
    await testMinting("Test 7.4, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(3020);
    const balanceUSDCafter2nd = await polygonUSDC.balanceOf(testUser_1);
    const secondPriceForTenInCents = dividefrom6decToUSDCcents(bigNumberToNumber(balanceUSDCbefore2nd-balanceUSDCafter2nd));

    expect(firstPriceForTenInCents).to.equal(715);
    expect(secondPriceForTenInCents).to.equal(717);    

  });  
  */

  /*
  it("Test 8. Account levels and discounts should not be triggered below threshold", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 8.1, minting 19 BNJI to caller", 19, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(19);         
    await mintBlocks(1);      

    const userLevelAfter19 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter19 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 8.2, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(59);         
    await mintBlocks(1);      

    const userLevelAfter59 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));
    const userDiscountAfter59 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));  

    await testMinting("Test 8.3, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(99);             
    await mintBlocks(1);      

    const userLevelAfter99 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter99 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 8.4, minting 400 BNJI to caller", 400, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(499);         
    await mintBlocks(1);      

    const userLevelAfter499 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter499 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 8.5, minting 1500 BNJI to caller", 1500, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(1999); 
        
    await mintBlocks(1);      

    const userLevelAfter1999 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));
    const userDiscountAfter1999 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));  

    expect(userLevelStart).to.equal(0);
    expect(userLevelAfter19).to.equal(0);  
    expect(userLevelAfter59).to.equal(1);
    expect(userLevelAfter99).to.equal(2);  
    expect(userLevelAfter499).to.equal(3);
    expect(userLevelAfter1999).to.equal(4);   

    expect(userDiscountStart).to.equal(0);
    expect(userDiscountAfter19).to.equal(0);  
    expect(userDiscountAfter59).to.equal(5);
    expect(userDiscountAfter99).to.equal(10);  
    expect(userDiscountAfter499).to.equal(20);
    expect(userDiscountAfter1999).to.equal(40);       

  });  

  it("Test 9. Account levels should be triggered when reching threshold", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 9.1, minting 20 BNJI to caller", 20, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(20);         
    await mintBlocks(1);      

    const userLevelAfter20 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter20 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 9.2, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(60);         
    await mintBlocks(1);      

    const userLevelAfter60 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter60 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 9.3, minting 40 BNJI to caller", 40, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(100);             
    await mintBlocks(1);      

    const userLevelAfter100 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter100 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 9.4, minting 400 BNJI to caller", 400, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(500);         
    await mintBlocks(1);      

    const userLevelAfter500 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter500 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 9.5, minting 1500 BNJI to caller", 1500, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(2000); 
        
    await mintBlocks(1);      

    const userLevelAfter2000 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter2000 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    expect(userLevelStart).to.equal(0);
    expect(userLevelAfter20).to.equal(1);  
    expect(userLevelAfter60).to.equal(2);
    expect(userLevelAfter100).to.equal(3);  
    expect(userLevelAfter500).to.equal(4);
    expect(userLevelAfter2000).to.equal(5); 

    expect(userDiscountStart).to.equal(0);
    expect(userDiscountAfter20).to.equal(5);  
    expect(userDiscountAfter60).to.equal(10);
    expect(userDiscountAfter100).to.equal(20);  
    expect(userDiscountAfter500).to.equal(40);
    expect(userDiscountAfter2000).to.equal(75); 
  });  

  it("Test 10. Account Level 2 can be purchased in one go ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 10, minting 60 BNJI to caller", 60, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(60);       

    const userLevelAfter60 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter60 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter60).to.equal(2);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter60).to.equal(10);
   
  });  

  it("Test 11. Account Level 3 can be purchased in one go ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 11, minting 100 BNJI to caller", 100, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(100);       

    const userLevelAfter100 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter100 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter100).to.equal(3);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter100).to.equal(20);
   
  });  

  it("Test 12. Account Level 4 can be purchased in one go ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 12, minting 500 BNJI to caller", 500, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(500);       

    const userLevelAfter500 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter500 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter500).to.equal(4);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter500).to.equal(40);
   
  });  

  it("Test 13. Account Level 5 can be purchased in one go ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 13, minting 2000 BNJI to caller", 2000, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(2000);       

    const userLevelAfter2000 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter2000 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter2000).to.equal(5);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter2000).to.equal(75);
   
  });  

  it("Test 14. Minting inside of levels works as expected", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 14.1, minting 10 BNJI to caller", 10, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(10);       

    const userLevelAfter10 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter10 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await mintBlocks(1); 

    await testMinting("Test 14.1, minting 9 BNJI to caller", 9, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(19);       

    const userLevelAfter19 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter19 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter10).to.equal(0);    
    expect(userLevelAfter19).to.equal(0);

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter10).to.equal(0);   
    expect(userDiscountAfter19).to.equal(0);   
  });  
  */
  /*
  it("Test 15. Account Level 1 is purchased by buying more than threshold, less than next threshold ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 15, minting 25 BNJI to caller", 25, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(25);       

    const userLevelAfter25 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter25 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter25).to.equal(1);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter25).to.equal(5);
   
  });  

  it("Test 15. Larger purchases do not trigger more than account level 5 ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 15.1, minting 2500 BNJI to caller", 2500, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(2500);       

    const userLevelAfter2500 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter2500 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    await mintBlocks(1); 

    await testMinting("Test 15.2, minting 2500 BNJI to caller", 1500, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(4000);       

    const userLevelAfter4000 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter4000 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter2500).to.equal(5);    
    expect(userLevelAfter4000).to.equal(5);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter2500).to.equal(75);
    expect(userDiscountAfter4000).to.equal(75);
   
  });  
  */
  /*
  it("Test 16. There is no time-lock for buying and discounts are effective immediately upon having the needed balance ", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 16.1, minting 2500 BNJI to caller", 25, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(25);       

    const userLevelAfter25 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter25 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    await mintBlocks(1); 

    await testMinting("Test 16.2, minting 35 BNJI to caller", 35, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(60);       

    const userLevelAfter60 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter60 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 16.3, minting 39 BNJI to caller", 39, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(99);       

    const userLevelAfter99 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter99 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter25).to.equal(1);    
    expect(userLevelAfter60).to.equal(2); 
    expect(userLevelAfter99).to.equal(2);    

    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter25).to.equal(5);
    expect(userDiscountAfter60).to.equal(10);
    expect(userDiscountAfter99).to.equal(10);
   
  });  

  it("Test 17. It is possible to skip levels by minting larger amounts of tokens", async function () {   

    const userLevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1)); 

    await testMinting("Test 17.1, minting 2500 BNJI to caller", 25, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(25);       

    const userLevelAfter25 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter25 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    await mintBlocks(1); 

    await testMinting("Test 17.2, minting 35 BNJI to caller", 75, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(100);       

    const userLevelAfter100 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const userDiscountAfter100 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));    

    expect(userLevelStart).to.equal(0);    
    expect(userLevelAfter25).to.equal(1);    
    expect(userLevelAfter100).to.equal(3); 
   
    expect(userDiscountStart).to.equal(0);   
    expect(userDiscountAfter25).to.equal(5);
    expect(userDiscountAfter100).to.equal(20);     
  });  */
  /*
  it("Test 18. It is possible to transfer tokens", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    const user_1_LevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));   
    
    const user_2_LevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_2)); 
    const user_2_DiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_2));    

    await testMinting("Test 18.1, minting 120 BNJI to user 1", 120, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(120);       
    
    const user_1_LevelAfter120 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const user_1_DiscountAfter120 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    await mintBlocks(30); 

    await benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 40); 
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(80);    
    expect(await balBNJI(testUser_2)).to.equal(40); 
    
    console.log("BNJI bal user 1:", await balBNJI(testUser_1));
    console.log("BNJI bal user 2:", await balBNJI(testUser_2));

    
    const user_1_LevelAfter80 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const user_1_DiscountAfter80 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    const user_2_LevelAfter40 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_2)); 
    const user_2_DiscountAfter40 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_2));
    
    expect(user_1_LevelStart).to.equal(0);    
    expect(user_1_LevelAfter120).to.equal(3);    
    expect(user_1_LevelAfter80).to.equal(2);     
   
    expect(user_1_DiscountStart).to.equal(0);   
    expect(user_1_DiscountAfter120).to.equal(20);
    expect(user_1_DiscountAfter80).to.equal(10);

    expect(user_2_LevelStart).to.equal(0);    
    expect(user_2_LevelAfter40).to.equal(1); 

    expect(user_2_DiscountStart).to.equal(0);    
    expect(user_2_DiscountAfter40).to.equal(5);  
    
  });  

  it("Test 19. It is possible to mint tokens to another account", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);    

    const user_1_LevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));   
    
    const user_2_LevelStart = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_2)); 
    const user_2_DiscountStart = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_2));    

    await testMinting("Test 19, minting 120 BNJI from user 1 to user 2", 120, testUser_1, testUser_2);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(0); 
    expect(await balBNJI(testUser_2)).to.equal(120);       
    
    const user_1_LevelShouldBeSame = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1)); 
    const user_1_DiscountShouldBeSame = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    const user_2_LevelAfter120Received = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_2)); 
    const user_2_DiscountAfter120Received = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_2));

    await mintBlocks(1);     
    
    expect(user_1_LevelStart).to.equal(0);    
    expect(user_1_LevelShouldBeSame).to.equal(0);

    expect(user_1_DiscountStart).to.equal(0);   
    expect(user_1_DiscountShouldBeSame).to.equal(0);   

    expect(user_2_LevelStart).to.equal(0);    
    expect(user_2_LevelAfter120Received).to.equal(3); 

    expect(user_2_DiscountStart).to.equal(0);    
    expect(user_2_DiscountAfter120Received).to.equal(20);  
    
  });  
  */
  /*
  it("Test 20. It is possible to burn tokens and reward the USDC to another account", async function () {   

    expect(await balBNJI(testUser_1)).to.equal(0);  
    expect(await balBNJI(testUser_2)).to.equal(0);         

    await testMinting("Test 20, minting 120 BNJI from user 1 to user 1", 120, testUser_1, testUser_1);    
    confirmMint();
    expect(await balBNJI(testUser_1)).to.equal(120); 
    expect(await balBNJI(testUser_2)).to.equal(0);  
    
    await mintBlocks(30);    
    
    const user_1_USDCbalBefore = await balUSDC(testUser_1);
    const user_2_USDCbalBefore = await balUSDC(testUser_2);

    await testBurning("Test 20, burning 50 BNJI, return goes to acc2", 50, testUser_1, testUser_2);    
    confirmBurn();

    expect(await balBNJI(testUser_1)).to.equal(70); 
    expect(await balBNJI(testUser_2)).to.equal(0);  

    const user_1_USDCbalAfter = await balUSDC(testUser_1);
    const user_2_USDCbalAfter = await balUSDC(testUser_2);      
        
    expect(user_1_USDCbalBefore).to.equal(2913.44);    
    expect(user_2_USDCbalBefore).to.equal(0);

    expect(user_1_USDCbalAfter).to.equal(2913.44);   
    expect(user_2_USDCbalAfter).to.equal(34.8);       
  });  
  */
  /* 
  it("Test 21. Should first REVERT: testUser_1 tries to burn tokens before holding period ends, then correctly", async function () {   

    await testMinting("Test 21, minting 60 BNJI to caller", 60, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(60);

    const user_1_LevelAfter60 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfter60 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    await mintBlocks(5);    
    
    await expect( benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 30) ).to.be.revertedWith(
      "BNJ, transfer: sender is not yet allowed to withdraw/burn"
    );

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(60);

    await mintBlocks(8); 

    await benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 30);

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(30);
    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_2))).to.equal(30);

    const user_1_LevelAfter30 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfter30 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    expect(user_1_LevelAfter60).to.equal(2);    
    expect(user_1_DiscountAfter60).to.equal(10);

    expect(user_1_LevelAfter30).to.equal(1);   
    expect(user_1_DiscountAfter30).to.equal(5);     

  });  
  */
  /*
  it("Test 22. It is possible to skip levels by burning larger amounts of tokens", async function () {

    await testMinting("Test 22.1, minting 600 BNJI to caller", 600, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(600);

    const user_1_LevelAfter600 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfter600 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    await mintBlocks(180);    

    //const needed = await benjaminsContract.getBlockAmountStillToWait(testUser_1);
    //decipherBlockFeedback(needed);     
    
    await testBurning("Test 22.2, burning 570 tokens after needed amount of blocks", 570, testUser_1, testUser_1);

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(30);    

    const user_1_LevelAfter30 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfter30 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    expect(user_1_LevelAfter600).to.equal(4);    
    expect(user_1_DiscountAfter600).to.equal(40);

    expect(user_1_LevelAfter30).to.equal(1);   
    expect(user_1_DiscountAfter30).to.equal(5);  
     
  });
  */
  
  it("Test 23. It is possible to skip levels by burning larger amounts of tokens", async function () {

    await testMinting("Test 22.1, minting 506 BNJI to caller", 506, testUser_1, testUser_1);    
    confirmMint();

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(506);
    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_2))).to.equal(0);

    const user_1_LevelAfter506 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfter506 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));

    await mintBlocks(180);        
    
    await benjaminsContract.connect(testUser_1_Signer).transfer(testUser_2, 506); 
      
    const user_1_LevelAfterTransferAll = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_1));     
    const user_1_DiscountAfterTransferAll = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_1));
    
    const user_2_LevelAfter506 = bigNumberToNumber (await benjaminsContract.calcCurrentLevel(testUser_2));     
    const user_2_DiscountAfter506 = bigNumberToNumber (await benjaminsContract.calcDiscount(testUser_2));   

    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_1))).to.equal(0); 
    expect(bigNumberToNumber (await benjaminsContract.balanceOf(testUser_2))).to.equal(506);     

    expect(user_1_LevelAfter506).to.equal(4);    
    expect(user_1_DiscountAfter506).to.equal(40);     

    expect(user_1_LevelAfterTransferAll).to.equal(0);   
    expect(user_1_DiscountAfterTransferAll).to.equal(0);   

    expect(user_2_LevelAfter506).to.equal(4);   
    expect(user_2_DiscountAfter506).to.equal(40);   
     
  });
  
 
}); 
