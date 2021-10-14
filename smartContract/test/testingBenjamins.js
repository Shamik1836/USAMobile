const { expect } = require("chai");
const { ethers } = require("hardhat");
const { fixture } = deployments;

// Customized helpers

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
let burnReturnTotalInUSDCShouldBeNowGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
let burnReturnTotalInUSDCWasPaidNowGlobalV;

const scale6dec = 1000000;

let testingUserAddressesArray = [];

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

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = (ethers.utils.formatUnits(bignumber, 0)).toString();  
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

function decipherStakesArray (stakesArray) {
  for (let index = 0; index < stakesArray.length; index++) {
    console.log("stake in index: ", index);
    console.log("stakingAddress:", stakesArray[index].stakingAddress); 
    console.log("stakeID:", bigNumberToNumber (stakesArray[index].stakeID)); 
    console.log("tokenAmount:", bigNumberToNumber(stakesArray[index].tokenAmount));
    console.log("stakeCreatedTimestamp:", bigNumberToNumber(stakesArray[index].stakeCreatedTimestamp));
    console.log("was unstaked:", stakesArray[index].unstaked);
  }
}

async function internalMint(amountToMint, amountToApproveInCents, addressToHoldInternalMint) {
  const totalSupplyBeforeMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(deployer))); 
  //const contractUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceBefore = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedBefore = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(deployer)); 
  const contractBNJIbalBefore = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  // allowing benjaminsContract to handle USDC for deployer   
  const amountToApproveIn6dec = multiplyFromUSDCcentsTo6dec(amountToApproveInCents);  
  console.log( bigNumberToNumber(amountToApproveIn6dec), 'amountToApproveIn6dec in internalMint');     
  await polygonUSDC.approve(benjaminsContract.address, amountToApproveIn6dec);
  // args: internalMint(uint256 amount, address holderOfInternalMint)
  await benjaminsContract.connect(deployerSigner).internalMint(amountToMint, addressToHoldInternalMint);  
  
  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(deployer))); 
  //const contractUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceAfter = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedAfter = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(deployer)); 
  const contractBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  const contractAMUSDCdiffMintInCents = contractAMUSDCbalanceAfter - contractAMUSDCbalanceBefore;
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  console.log(fromCentsToUSDC(contractAMUSDCbalanceBefore), `benjaminsContract amUSDC balance before internalMint`);
  console.log(fromCentsToUSDC(contractAMUSDCbalanceAfter), `benjaminsContract amUSDC balance after internalMint`);

  console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents), `deployer USDC balance before internalMint`);
  console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents), `deployer USDC balance after internalMint`);    

  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeMintInCents), `feeReceiver USDC balance before internalMint`);
  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterMintInCents), `feeReceiver USDC balance after internalMint`);
  
  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents), `deployer internalMint price paid in USDC`);
  console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `benjaminsContract received in amUSDC`);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver internalMint fee received in USDC`);  

  console.log(totalSupplyBeforeMint, `Benjamins total supply before internalMinting ${amountToMint} Benjamins`); 
  console.log(totalSupplyAfterMint, `Benjamins total supply after internalMinting ${amountToMint} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before internalMint`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after internalMint`);

  console.log(callingAccBNJIstakedBefore, `deployer is staking this many BNJI before internalMint`);
  console.log(callingAccBNJIstakedAfter, `deployer is staking this many BNJI after internalMint`);

  

  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = amountToApproveInCents;
}

async function showUsersCompleteStakesArray(userAddress) {
  const callingAccCompleteStakesArray = await benjaminsContract.connect(deployerSigner).showAllUsersStakes(userAddress);
  decipherStakesArray(callingAccCompleteStakesArray);
}

async function showInternalBenjamins(userTocheck) {
  const holdersInternalBenjamins = bigNumberToNumber(await benjaminsContract.connect(deployerSigner).showInternalBenjamins(userTocheck)); 
  console.log('holder of internal benjamins:', userTocheck) 
  console.log('amount of holders internal benjamins:', holdersInternalBenjamins)
}

async function testMinting(mintName, amountToMint, amountToApproveInCents, callingAccAddress) {

  console.log('calling acount address in testMinting is now:', callingAccAddress);
 
  const totalSupplyBeforeMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress))); 
  //const contractUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceBeforeMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceBeforeMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedBefore = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(callingAccAddress)); 
  const contractBNJIbalBefore = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const amountToApproveIn6dec = multiplyFromUSDCcentsTo6dec(amountToApproveInCents);  
  console.log(bigNumberToNumber(amountToApproveIn6dec), 'amountToApproveIn6dec in testMinting', );     
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);

  const givenAllowanceToBNJIcontract = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  console.log(bigNumberToNumber(givenAllowanceToBNJIcontract), `givenAllowanceToBNJIcontract in testMinting by ${callingAccAddress}` ); 


  // buying levels, includes minting and staking ${amountToMint} tokens
  const levelsToBuy = amountToMint / 20;
  
  await benjaminsContract.connect(callingAccSigner).buyLevels(levelsToBuy);  
  console.log(`========================== ${callingAccAddress} is buying this many levels:`, levelsToBuy );

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress))); 
  //const contractUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceAfterMintInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceAfterMintInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedAfter = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(callingAccAddress)); 
  const contractBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

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
  console.log(fromCentsToUSDC(contractAMUSDCdiffMintInCents), `benjaminsContract received in amUSDC`);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffMintInCents), `feeReceiver mint fee received in USDC:`);  
  console.log(fromCentsToUSDC(callingAccMintPricePaidInCents - contractAMUSDCdiffMintInCents), `should be the fee received, in USDC`); 

  console.log(totalSupplyBeforeMint, `Benjamins total supply before minting ${amountToMint} Benjamins`); 
  console.log(totalSupplyAfterMint, `Benjamins total supply after minting ${amountToMint} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${mintName}`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after${mintName}`);

  console.log(callingAccBNJIstakedBefore, `${callingAccAddress} is staking this many BNJI before minting/staking`);
  console.log(callingAccBNJIstakedAfter, `${callingAccAddress} is staking this many BNJI after minting/staking`);

  

  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = amountToApproveInCents;

};

async function testBurning(burnName, amountToBurn, callingAccAddress) { 
 
  const totalSupplyBeforeBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceBeforeBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress))); 
  //const contractUSDCBalanceBeforeBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceBeforeBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedBefore = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(callingAccAddress)); 
  const contractBNJIbalBefore = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  
  // selling levels, includes burining and unstaking ${amountToBurn} tokens
  const levelsToSell = amountToBurn / 20;

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  await benjaminsContract.connect(callingAccSigner).sellLevels(levelsToSell);  
  console.log(`=========   User is selling this many levels:`, levelsToSell );

  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const callingAccUSDCBalanceAfterBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(callingAccAddress))); 
  //const contractUSDCBalanceAfterBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(benjaminsContract.address))); 
  const feeReceiverUSDCBalanceAfterBurnInCents = dividefrom6decToUSDCcents(bigNumberToNumber(await polygonUSDC.balanceOf(feeReceiverAddress))); 
  const contractAMUSDCbalanceAfterBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
  const callingAccBNJIstakedAfter = bigNumberToNumber(await benjaminsContract.checkStakedBenjamins(callingAccAddress)); 
  const contractBNJIbalAfter = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address)); 

  const callingAccBurnReturnReceivedInCents = callingAccUSDCBalanceAfterBurnInCents - callingAccUSDCBalanceBeforeBurnInCents;
  const contractAMUSDCdiffBurnInCents = contractAMUSDCbalanceBeforeBurnInCents - contractAMUSDCbalanceAfterBurnInCents ;
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;     
  
  
  console.log(fromCentsToUSDC(contractAMUSDCbalanceBeforeBurnInCents), `benjaminsContract amUSDC balance before ${burnName}`);
  console.log(fromCentsToUSDC(contractAMUSDCbalanceAfterBurnInCents), `benjaminsContract amUSDC balance after ${burnName}`);

  console.log(fromCentsToUSDC(callingAccUSDCBalanceBeforeBurnInCents), `${callingAccAddress} USDC balance before ${burnName}`);
  console.log(fromCentsToUSDC(callingAccUSDCBalanceAfterBurnInCents), `${callingAccAddress} USDC balance after ${burnName}`);    

  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceBeforeBurnInCents), `feeReceiver USDC balance before ${burnName}`);
  console.log(fromCentsToUSDC(feeReceiverUSDCBalanceAfterBurnInCents), `feeReceiver USDC balance after ${burnName}`);
  
  console.log(fromCentsToUSDC(callingAccBurnReturnReceivedInCents), `${callingAccAddress} burn return received in USDC`);
  console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents), `benjaminsContract paid out in amUSDC`);

  console.log(fromCentsToUSDC(feeReceiverUSDCdiffBurnInCents), `feeReceiver burn fee received in USDC:`);  
  console.log(fromCentsToUSDC(contractAMUSDCdiffBurnInCents - callingAccBurnReturnReceivedInCents), `should be the fee received, in USDC`); 

  console.log(totalSupplyBeforeBurn, `Benjamins total supply before burning ${amountToBurn} Benjamins`); 
  console.log(totalSupplyAfterBurn, `Benjamins total supply after burning ${amountToBurn} Benjamins`); 

  console.log(contractBNJIbalBefore, `benjaminsContract owns/manages this many benjamins before ${burnName}`);
  console.log(contractBNJIbalAfter, `benjaminsContract owns/manages this many benjamins after ${burnName}`);

  console.log(callingAccBNJIstakedBefore, `deployer is staking this many BNJI before burning/unstaking`);
  console.log(callingAccBNJIstakedAfter, `deployer is staking this many BNJI after burning/unstaking`);   

  console.log(`Benjamin total supply after, burning ${amountToBurn} tokens:`, totalSupplyAfterBurn); 

  burnReturnTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(contractAMUSDCdiffBurnInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

};

function confirmMint(nrOfTokensExisting, amountToMint){
  calcMintVariables(nrOfTokensExisting, amountToMint);
  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
};

function confirmBurn(nrOfTokensExisting, amountToBurn){
  calcBurnVariables(nrOfTokensExisting, amountToBurn);
  expect(tokensShouldExistNowGlobalV).to.equal(Number(tokensExistQueriedGlobalV));
  expect(burnReturnTotalInUSDCShouldBeNowGlobalV).to.equal(Number(burnReturnTotalInUSDCWasPaidNowGlobalV));
};

function calcMintVariables(nrOfTokensExisting, amountToMint) {
  //console.log(`calcMintVariables: nrOfTokensExisting: `, nrOfTokensExisting);  
  //console.log(`calcMintVariables: amountToMint: `, amountToMint);  

  const amountOfTokensAfterMint = Number (nrOfTokensExisting) + Number (amountToMint);
  
  const afterMintSupplySquared = amountOfTokensAfterMint * amountOfTokensAfterMint;
  const supplyNowSquared = nrOfTokensExisting * nrOfTokensExisting;
  const difference = afterMintSupplySquared - supplyNowSquared;
  const resultShouldBe = difference / 800000;
  /*
  console.log(`calcMintVariables: amountOfTokensAfterMint: `, amountOfTokensAfterMint);  
  console.log(`calcMintVariables: afterMintSupplySquared: `, afterMintSupplySquared);  
  console.log(`calcMintVariables: supplyNowSquared: `, supplyNowSquared);  
  console.log(`calcMintVariables: difference: `, difference);  
  console.log(`calcMintVariables: resultShouldBe: `, resultShouldBe); 
  */
  const purePriceForTokensMintingNowInUSDC = ( (amountOfTokensAfterMint * amountOfTokensAfterMint) - (nrOfTokensExisting * nrOfTokensExisting) ) / 800000;

  const inCentsPurePriceForTokensMintingNow = purePriceForTokensMintingNowInUSDC * 100;
  const inCentsRoundedDown = inCentsPurePriceForTokensMintingNow - (inCentsPurePriceForTokensMintingNow % 1);
  const mintFeeStarter = inCentsPurePriceForTokensMintingNow / 100;
  const roundingForFeeDifference = mintFeeStarter % 1;

  const mintFee = mintFeeStarter - roundingForFeeDifference;
  const inCentsToPayTotal = inCentsRoundedDown + mintFee;
  const inUSDCToPayTotal = inCentsToPayTotal / 100;
 // console.log(`calcMintVariables: Price before fee (math curve response): `, purePriceForTokensMintingNowInUSDC);  
  //console.log(`calcMintVariables: Total price in USDC (incl fee & rounded down cents): ` + inUSDCToPayTotal);
  //console.log(`calcMintVariables: Mint fee in USDC is: ` + (mintFee / 100));
  //console.log(`========================Mint End====================================`);

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCShouldBeNowGlobalV = inUSDCToPayTotal;
  mintAllowanceInUSDCCentsShouldBeNowGlobalV = inCentsToPayTotal;

  return multiplyFromUSDCcentsTo6dec(inCentsToPayTotal);
}

function calcBurnVariables(nrOfTokensExisting, amountToBurn) {
  
  const amountOfTokensAfterBurn = nrOfTokensExisting - amountToBurn;
  const totalReturnForTokensBurningNowInUSDC = ( (nrOfTokensExisting * nrOfTokensExisting) - (amountOfTokensAfterBurn * amountOfTokensAfterBurn) ) / 800000;

  const inCentsTotalReturnForTokensBurningNow = totalReturnForTokensBurningNowInUSDC * 100;
  const inCentsRoundedDownBurn = inCentsTotalReturnForTokensBurningNow - (inCentsTotalReturnForTokensBurningNow % 1);
  const burnFeeStarter = inCentsTotalReturnForTokensBurningNow / 100;
  const burnRoundingForFeeDifference = burnFeeStarter % 1;

  const burnFee = burnFeeStarter - burnRoundingForFeeDifference;
  const inCentsToReceiveTotal = inCentsRoundedDownBurn - burnFee;
  const inUSDCToReceiveTotal = inCentsToReceiveTotal / 100;
  //console.log(`calcBurnVariables: Return before fee (math curve response): ` + totalReturnForTokensBurningNowInUSDC);
  //console.log(`calcBurnVariables: User receives (after fee & rounded down cents):  ` + inUSDCToReceiveTotal);
  //console.log(`calcBurnVariables: Burn fee is: ` + (burnFee / 100));
  //console.log(`Burn End====================================`);
   
  tokensShouldExistNowGlobalV = amountOfTokensAfterBurn;
  burnReturnTotalInUSDCShouldBeNowGlobalV = inCentsRoundedDownBurn/100;
}

const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));  

async function runMintOrBurnLoop(loopsToRun) {
  let randomMintOrBurn;
  let mintCounter = 0;
  let burnCounter = 0;

  // running either minting or burning, this many loops: opCounter
  for (opCounter = 1; opCounter <= loopsToRun; opCounter++) {
    // randomizing minting or burning
    randomMintOrBurn = Math.floor (Math.random() * 10);
    console.log('randomMintOrBurn', randomMintOrBurn); 

    const acc5TokenBalanceOperationStart = bigNumberToNumber( await benjaminsContract.balanceOf(normUserAddress) );
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
      
      let tokensExistingBeforeBurn = bigNumberToNumber( await benjaminsContract.totalSupply() );        
      
      //calcBurnVariables(nrOfTokensExisting, amountToBurn);         

      calcBurnVariables(tokensExistingBeforeBurn, randomAmountBurning);
      
      checkBurningAmountOkay(); // checking if amount is okay

      console.log(`operation nr: ${opCounter} will BURN this many tokens:`, randomAmountBurning);

      burnCounter++;

      //testBurning(burnName, amountToBurn, callingAccAddress)
      await testBurning(`operation nr: ${opCounter}, burning`, randomAmountBurning, normUserAddress);

      totalReturned += burnReturnTotalInUSDCWasPaidNowGlobalV;

      // confirmBurn(nrOfTokensExisting, amountToBurn)
      confirmBurn(tokensExistingBeforeBurn, randomAmountBurning); 
    }

    // MINTING
    // if randomMintOrBurn = one of these: 0,1,2,3,4, mint. 
    else {
      console.log(`operation nr: ${opCounter} is MINTING`);

      const acc5USDCBalanceOperationStart = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(normUserAddress)) );
      console.log(`acc5 has this many USDC before operation nr: ${opCounter} :`, acc5USDCBalanceOperationStart);           

      // local function to check minting amount repeatedly until it's okay
      function checkMintingAmountOkay() {
        if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 5000 || (mintAllowanceInUSDCCentsShouldBeNowGlobalV/100) > acc5USDCBalanceOperationStart) {
          if (mintAllowanceInUSDCCentsShouldBeNowGlobalV < 5000) {
            console.log(`RERUN, mint call would be under $5`);  
            randomAmountMinting = Math.floor (Math.random() * 100000); 
          }
          if ((mintAllowanceInUSDCCentsShouldBeNowGlobalV/100) > acc5USDCBalanceOperationStart){
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
      
      let tokensExistingNow = bigNumberToNumber( await benjaminsContract.totalSupply() );        
      
      //calcMintVariables(nrOfTokensExisting, amountToMint);
      calcMintVariables(tokensExistingNow, randomAmountMinting);
      
      checkMintingAmountOkay(); // checking if amount is okay

      console.log(`operation nr: ${opCounter} will MINT this many tokens:`, randomAmountMinting);

      mintCounter++;

      //testMinting(mintName, amountToMint, amountToApproveInCents, callingAccAddress)
      await testMinting(`operation nr: ${opCounter}, minting`, randomAmountMinting, mintAllowanceInUSDCCentsShouldBeNowGlobalV, normUserAddress, 0);

      totalSpent += mintPriceTotalInUSDCWasPaidNowGlobalV;

      //confirmMint(nrOfTokensExisting, amountToMint)
      confirmMint(tokensExistingNow, randomAmountMinting); 

    } 
    
  }

  loopCounterTotal += (opCounter-1);
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;  

  const protocolBalanceAfterTest = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(benjaminsContract.address)) );
  console.log('protocol our contract USDC balance at the end of all loops so far', protocolBalanceAfterTest);
  const protocolBalanceAfterTestJSExactness = Number(protocolBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);
  
  const acc5USDCBalanceAfterTest = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(normUserAddress)) );
  console.log('acc5 user USDC balance at the end of all loops so far', acc5USDCBalanceAfterTest);
  const acc5USDCBalanceAfterTestJSExactness = Number(acc5USDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const feeReceiverUSDCBalanceAfterTest = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(feeReceiverAddress)) );
  console.log('feeReceiver USDC balance at the end of all loops so far', feeReceiverUSDCBalanceAfterTest);
  const feeReceiverUSDCBalanceAfterTestJSExactness = Number(feeReceiverUSDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const inTotalUSDCExistafterTest = protocolBalanceAfterTestJSExactness + acc5USDCBalanceAfterTestJSExactness + feeReceiverUSDCBalanceAfterTestJSExactness ; 
  console.log('JS * 100 check', inTotalUSDCExistafterTest);

  const jsExactnessResolved = inTotalUSDCExistafterTest / 100;
  console.log('in total USDC at the end of all loops so far', jsExactnessResolved);

  const callingAccEndTokenBalance = bigNumberToNumber( await benjaminsContract.balanceOf(normUserAddress) );
  console.log('at the end of all loops so far, acc 5 has this many tokens:', callingAccEndTokenBalance);

  console.log(`test ran ${loopCounterTotal} loops so far, of which ${mintCounterTotal} were mints and ${burnCounterTotal} were burns`); 
  console.log(`so far, ${totalSpent} USDC were spent by acc5 and ${totalReturned} USDC were paid out by the contract in total`); 


} 








describe("Benjamins Test", function () {

  // setting instances of contracts
  before(async function() {

    console.log("starting before part here ------");

    ({ deployer, feeReceiverAddress, testUser_1, testUser_2, testUser_3, testUser_4, testUser_5 } = await getNamedAccounts());

    console.log("got through getNamedAccounts here ------");

    deployerSigner = await ethers.provider.getSigner(deployer); 
    
    console.log("got through getSigner for deployer here ------");

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

  })      
  
  it("Test 1. Should show deployment went as expected", async function () {
    
    // after deployment, querying benjamins balance of deployer, logging as number and from WEI to ETH
    const startingBalanceInbenjamins = bigNumberToNumber(await benjaminsContract.balanceOf(deployer));    
    console.log("deployer owns/controls this many benjamins after deployment: ", startingBalanceInbenjamins);

    // after deployment, querying benjamins total supply
    const totalSupplyAfterDeploy = bigNumberToNumber(await benjaminsContract.totalSupply()) ;
    console.log("benjamins total supply after deployment: ", totalSupplyAfterDeploy);   

    /*
    // after deployment, checking allowance between BenjaminsContract and LendingPool
    const contractAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(benjaminsContract.address, polygonLendingPool.address)) ;
    const deployerAllowanceAfterDeploy = bigNumberToNumber(await polygonUSDC.allowance(deployer, polygonLendingPool.address)) ;
    console.log("contractAllowanceAfterDeploy: ", contractAllowanceAfterDeploy);   
    console.log("deployerAllowanceAfterDeploy: ", deployerAllowanceAfterDeploy);
    */   

    console.log("polygonUSDC address: ", polygonUSDC.address);   
    console.log("polygonLendingPool address: ", polygonLendingPool.address);  
    console.log("polygonAmUSDC address: ", polygonAmUSDC.address);    
      
  });    
  
  it("Test 2. Should impersonate MATIC-heavy account and send MATIC to deployer ", async function () {    

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
    console.log('whaleSignerAddress:', whaleSignerAddress);  

    const whaleMaticBefore = await getMaticBalance(whaleSignerAddress);
    console.log('whale has this many MATIC before sending whale transfer:', whaleMaticBefore);   

    const deployerMaticBefore = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC before getting whale transfer:', deployerMaticBefore);   
      
    await whaleSigner.sendTransaction({
      to: deployer,
      value: ethers.utils.parseEther("5000000") // 5,000,000 Matic
    })

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: ["0x986a2fCa9eDa0e06fBf7839B89BfC006eE2a23Dd"],
    });

    

    const whaleMaticAfter = await getMaticBalance(whaleSignerAddress);
    console.log('whale has this many MATIC after sending whale transfer:', whaleMaticAfter); 

    const deployerMaticAfter = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC after getting whale transfer:', deployerMaticAfter);   
    
  });  

  it("3. Deployer should wrap MATIC into WMATIC", async function () {
       
    polygonWMATIC = new ethers.Contract(
      polygonWMATICaddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function deposit() public payable',            
      ], 
      deployerSigner
    );

    const deployerMaticBeforeWrapping = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC before wrapping:', deployerMaticBeforeWrapping);  
    
    
    
    await polygonWMATIC.deposit( {value: ethers.utils.parseEther("4000000")} );

    const deployerMaticAfterWrapping = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC after wrapping:', deployerMaticAfterWrapping);
   
  });    

  it("4. Deployer should exchange WMATIC for USDC on polygon via QuickSwap", async function () {

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

      
    const deployerUSDCbalStart2 = fromWEItoETH18dig( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    console.log('deployer has this many USDC before using DEX:', deployerUSDCbalStart2);
    
    /*
    // function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)
    let amountWMATICToSwapToUSDCInWEI =  ethers.utils.parseEther("5000000");
    let getoutMin = 4000000 * (10**6);    
    await polygonQuickswapRouter.swapExactTokensForTokens( amountWMATICToSwapToUSDCInWEI, getoutMin , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);
    */

    //function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)
    const amountToReceiveUSDCIn6dec = 1000000 * (10**6) //ethers.utils.parseEther("1000000");
    const amountInMaxInWEI = ethers.utils.parseEther("4000000"); //4000000 * (10**18);   
    await polygonQuickswapRouter.swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);

    /*
    let resultAmountsOut = [];
    resultAmountsOut = await polygonQuickswapRouter.getAmountsOut( ethers.utils.parseEther("5000000"),  [polygonWMATICaddress, polygonWETHaddress, polygonUSDCaddress]);
    console.log('resultAmountOut 1, WMATIC to WETH:', fromWEItoETH18dig(bigNumberToNumber(resultAmountsOut[1]))); 
    console.log('resultAmountOut 2, WETH to USDC:', divideFrom6decToUSDC(bigNumberToNumber(resultAmountsOut[2])));    

    await polygonQuickswapRouter.swapExactTokensForTokens( (ethers.utils.parseEther("4500000")), ethers.utils.parseEther("1200") , [polygonWMATICaddress, polygonWETHaddress], deployer, 1633624819);
    
    const deployerWETHbalEnd2 = fromWEItoETH18dig( bigNumberToNumber (await polygonWETH.balanceOf(deployer)) );
    console.log('deployer has this many WETH after using DEX:', deployerWETHbalEnd2);           

    await polygonWETH.approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("15000000") );

    await polygonQuickswapRouter.swapExactTokensForTokens( (ethers.utils.parseEther("1400")), (1000000 * (10**6)) , [polygonWETHaddress, polygonUSDCaddress], deployer, 1633624819);
    */

    const deployerUSDCbalEnd2 = divideFrom6decToUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    console.log('deployer has this many USDC after using DEX:', deployerUSDCbalEnd2);             
      
  });     
  
  it("5. Setting up: Internal minting and staking", async function () {        

    // args: internalMint(amountToMint, amountToApproveInCents, addressToHoldInternalMint)
    await internalMint(282840, 9999808, deployer);          
    await showInternalBenjamins(deployer);
    await benjaminsContract.connect(deployerSigner).unpause();
    
  });

  
  it("6. Preparing user addresses to test protocol ", async function () {   
    
    for (let index = 0; index < testingUserAddressesArray.length; index++) {
      const testingUser = testingUserAddressesArray[index];

      await deployerSigner.sendTransaction({
        to: testingUser,
        value: ethers.utils.parseEther("100") // 100 Matic
      })

      await polygonUSDC.connect(deployerSigner).transfer(testingUser, (1000*scale6dec) );

      const testingUserMATICbalance = await getMaticBalance(testingUser);
      const testingUserUSDCbalance = await polygonUSDC.balanceOf(testingUser) ;

      console.log('testingUser is:', testingUser);
      console.log(`${testingUser} has in Matic:`, testingUserMATICbalance);
      console.log(`${testingUser} has in USDC:`, divideFrom6decToUSDC(bigNumberToNumber(testingUserUSDCbalance)));           
    }  
    
  });
  
 

  it("8. testUser_1 - testUser_3 will buy 5 levels, i.e. mint and stake 100 tokens", async function () {    
    
    //First three users in array will mint 100 tokens / buy 5 levels
    for (let index = 0; index < 3; index++) {
      const testingUser = testingUserAddressesArray[index];


      let mintingAllowanceNeededin6dec = calcMintVariables(tokensExistQueriedGlobalV, 100);
      let mintingAllowanceNeededinUSDCcents = dividefrom6decToUSDCcents(mintingAllowanceNeededin6dec);
      console.log(mintingAllowanceNeededin6dec, `mintingAllowanceNeededin6dec in user mint nr ${index}`)

      // args: testMinting(mintName, amountToMint, amountToApproveInCents, callingAccAddress)
      await testMinting(`User mint nr ${index} `, 100, mintingAllowanceNeededinUSDCcents, testingUser);
      await showUsersCompleteStakesArray(testingUser);   
      console.log(`==============${testingUser} is DONE, NEXT USER =================`)
    }  
    
   

  });

    
  it("9. First burn", async function () {  
    
    await testBurning("First user burn", 80, testUser_2);
    await showUsersCompleteStakesArray(testUser_2);   

    /*
    const deployerStaked = bigNumberToNumber( await benjaminsContract.checkStakedBenjamins(deployer));
    console.log("deployer is staking in total: ", deployerStaked);

    const deployerStakedArray = await benjaminsContract.checkStakedArrayOfUser(deployer);
    //console.log("deployer's staking array: ", deployerStakedArray);

    

    //console.log('deployer', deployer);

    //console.log('benjaminsContract.address', benjaminsContract.address);

    

    //await benjaminsContract.callDepositStake(tokensToStake);

    
    //await benjaminsContract.callWithdrawStake();
    
    // REVERT: using callDepositStake as non-owner is reverted in benjamins contract
    //await expect( benjaminsContract.connect(normUserAddress).callDepositStake() ).to.be.revertedWith(
    //  "Ownable: caller is not the owner"
    //);  

    // REVERT: using depositStake directly as non-perator is reverted in staking contract
    //await expect( stakingContract.connect(normUserAddress).depositStake() ).to.be.revertedWith(
    //  "StakingContract: caller is not the operator"
    //); */

  })
}); 
