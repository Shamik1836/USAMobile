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

let scale6digits = 1000000;

let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let totalSpent = 0;
let totalReturned = 0;

let benjaminsContract;

let polygonUSDC;
const polygonUSDCaddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

let polygonLendingPool;
const polygonLendingPoolAddress = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';

let polygonAmUSDC;
const polygonAmUSDCAddress = '0x1a13F4Ca1d028320A707D99520AbFefca3998b7F';

let quickswapFactory;
const quickswapFactoryAddress = '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32';

const polygonMaticAddress = '0x0000000000000000000000000000000000001010';

let polygonWMATIC;
const polygonWMATICAddress = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

let polygonQuickswapRouter;
const polygonQuickswapRouterAddress = '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff';

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = (ethers.utils.formatUnits(bignumber, 0)).toString();  
  return convertedNumber;
}

// converting WEI to USDC
function fromWEItoUSDC (numberInWEI) {
  const numberInUSDC = Number( numberInWEI / (10**18) );      
  return numberInUSDC;    
}

// converting WEI to Cents
function fromWEItoCents (numberInWEI) {
  const numberInCents = Number( numberInWEI / (10**16) );      
  return numberInCents;    
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

// converting WEI to Cents
function fromCentstoWEI (numberInCents) {
  const numberInWEI = ethers.utils.parseUnits(numberInCents.toString(), 16);      
  return numberInWEI;    
}

async function getMaticBalance(adress) {    
  const balanceInWEI = await ethers.provider.getBalance(adress); 
  const balanceInMATIC = Number(balanceInWEI / (10**18) );        
  return balanceInMATIC;
}

/* // querying address' ETH balance
  // querying address' ETH balance and converting from WEI to ETH and into normal number
  async function getETHbalance(adress) {    
    const balanceInWEI = await ethers.provider.getBalance(adress); 
    const balanceInETH = fromWEItoETH(balanceInWEI);        
    return balanceInETH;
  }
*/

async function testMinting(mintName, amountToMint, ammountToApproveInCents, callingAccAddress) {

  const ammountToApproveInWEI = fromCentstoWEI(ammountToApproveInCents); 
  
  /*
    // REVERT: trying to mint tokens without enough USDC 
    await expect( benjaminsContract.connect(callingAccAddress).specifiedMint(amountToMint) ).to.be.revertedWith(
      "Not enough USDC"
    );   
  */   
  
  const callingAccUSDCBalanceBeforeMintBN = await polygonUSDC.balanceOf(callingAccAddress);
  const callingAccUSDCBalanceBeforeMintInCents = fromWEItoCents(callingAccUSDCBalanceBeforeMintBN);  
  const callingAccUSDCBalanceBeforeMintInUSDC = fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents);
  //console.log(`USDC balance of ${callingAccAddress} before ${mintName} `, callingAccUSDCBalanceBeforeMintInUSDC);   

  const contractUSDCBalanceBeforeMintBN = await polygonUSDC.balanceOf(benjaminsContract.address);
  const contractUSDCBalanceBeforeMintInCents = fromWEItoCents(contractUSDCBalanceBeforeMintBN);    
  //console.log(`benjaminsContract USDC balance before ${mintName} mint:`, fromCentsToUSDC(contractUSDCBalanceBeforeFirstMintInCents));

  const acc1USDCBalanceBeforeMintBN = await polygonUSDC.balanceOf(feeReceiverAddress);
  const acc1USDCBalanceBeforeMintInCents = fromWEItoCents(acc1USDCBalanceBeforeMintBN);    
  //console.log(`feeReceiver USDC balance before ${mintName} mint:`, fromCentsToUSDC(acc1USDCBalanceBeforeFirstMintInCents));

  /*
    // REVERT: trying to to mint tokens without giving the contract allowance for USDC 
    await expect( benjaminsContract.connect(callingAccAddress).specifiedMint(amountToMint) ).to.be.revertedWith(
      "Not enough allowance in USDC for payment"
    );   
  */    

  // allowing benjaminsContract to handle USDC for ${callingAcc}    
  await polygonUSDC.connect(callingAccAddress).approve(benjaminsContract.address, ammountToApproveInWEI);

  // minting ${amountOfTokensForFirstSpecifiedMint} tokens
  await benjaminsContract.connect(callingAccAddress).specifiedMint(amountToMint);

  // after minting ${amountOfTokensForFirstSpecifiedMint} tokens, querying benjamins balance of deployer, logging as number and from WEI to ETH
  const callingAccAfterMintBalanceInContToken = bigNumberToNumber( await benjaminsContract.balanceOf(callingAccAddress) );
  //console.log(`Token balance of deployer after minting ${amountOfTokensForFirstSpecifiedMint} tokens:`, afterFirstMintBalanceInContToken);

  // after minting ${amountOfTokensForFirstSpecifiedMint} tokens, querying benjamins total supply
  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 


  const callingAccUSDCBalanceAfterMintBN = await polygonUSDC.balanceOf(callingAccAddress);
  const callingAccUSDCBalanceAfterMintInCents = fromWEItoCents(callingAccUSDCBalanceAfterMintBN);    
  //console.log(`USDC balance of ${callingAccAddress} after ${mintName}:`, fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents) );        

  const contractUSDCBalanceAfterMintBN = await polygonUSDC.balanceOf(benjaminsContract.address);
  const contractUSDCBalanceAfterMintInCents = fromWEItoCents(contractUSDCBalanceAfterMintBN);    
  //console.log(`benjaminsContract USDC balance after ${mintName} mint:`, fromCentsToUSDC(contractUSDCBalanceAfterMintInCents));

  const acc1USDCBalanceAfterMintBN = await polygonUSDC.balanceOf(feeReceiverAddress);
  const acc1USDCBalanceAfterMintInCents = fromWEItoCents(acc1USDCBalanceAfterMintBN);    
  //console.log(`feeReceiver USDC balance after ${mintName} mint:`, fromCentsToUSDC(acc1USDCBalanceAfterMintInCents));       

  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
  const contractUSDCdiffMintInCents = contractUSDCBalanceAfterMintInCents - contractUSDCBalanceBeforeMintInCents;
  const acc1ReceiverUSDCdiffMintInCents = acc1USDCBalanceAfterMintInCents - acc1USDCBalanceBeforeMintInCents;     
  
  //console.log(`benjaminsContract USDC balance before ${mintName}:`, fromCentsToUSDC(contractUSDCBalanceBeforeMintInCents));
  //console.log(`benjaminsContract USDC balance after ${mintName}:`, fromCentsToUSDC(contractUSDCBalanceAfterMintInCents));

  //console.log(`${callingAccAddress} USDC balance before ${mintName}:`, fromCentsToUSDC(callingAccUSDCBalanceBeforeMintInCents));
  //console.log(`${callingAccAddress} USDC balance after ${mintName}:`, fromCentsToUSDC(callingAccUSDCBalanceAfterMintInCents));    

  //console.log(`feeReceiver USDC balance before ${mintName}:`, fromCentsToUSDC(acc1USDCBalanceBeforeMintInCents));
  //console.log(`feeReceiver USDC balance after ${mintName}:`, fromCentsToUSDC(acc1USDCBalanceAfterMintInCents));
  
  console.log(`${callingAccAddress} mint price paid in USDC:`, fromCentsToUSDC(callingAccMintPricePaidInCents));
  console.log(`benjaminsContract return received in USDC:`, fromCentsToUSDC(contractUSDCdiffMintInCents));
  console.log(`acc1 mint fee received in USDC:`, fromCentsToUSDC(acc1ReceiverUSDCdiffMintInCents));

  console.log(`fee received should be:`, fromCentsToUSDC(callingAccMintPricePaidInCents - contractUSDCdiffMintInCents) );

  console.log(`Token total supply after ${mintName} ${amountToMint} tokens:`, totalSupplyAfterMint); 

  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = ammountToApproveInCents;

};

async function testBurning(burnName, amountToBurn, callingAccAddress) { 
 
  const callingAccUSDCBalanceBeforeBurnBN = await polygonUSDC.balanceOf(callingAccAddress);
  const callingAccUSDCBalanceBeforeBurnInCents = fromWEItoCents(callingAccUSDCBalanceBeforeBurnBN);  
  const callingAccUSDCBalanceBeforeBurnInUSDC = fromCentsToUSDC(callingAccUSDCBalanceBeforeBurnInCents);
  console.log(`USDC balance of ${callingAccAddress} before ${burnName} burn:`, callingAccUSDCBalanceBeforeBurnInUSDC);        

  const contractUSDCBalanceBeforeBurnBN = await polygonUSDC.balanceOf(benjaminsContract.address);
  const contractUSDCBalanceBeforeBurnInCents = fromWEItoCents(contractUSDCBalanceBeforeBurnBN);    
  //console.log(`benjaminsContract USDC balance before ${burnName} burn:`, fromCentsToUSDC(contractUSDCBalanceBeforeFirstBurnInCents));

  const acc1USDCBalanceBeforeBurnBN = await polygonUSDC.balanceOf(feeReceiverAddress);
  const acc1USDCBalanceBeforeBurnInCents = fromWEItoCents(acc1USDCBalanceBeforeBurnBN);    
  //console.log(`feeReceiver USDC balance before ${burnName} burn:`, fromCentsToUSDC(acc1USDCBalanceBeforeFirstBurnInCents));

  // burning ${amountOfTokensForFirstSpecifiedBurn} tokens
  await benjaminsContract.connect(callingAccAddress).specifiedBurn(amountToBurn);

  // after burning ${amountOfTokensForFirstSpecifiedBurn} tokens, querying benjamins balance of deployer, logging as number and from WEI to ETH
  const callingAccAfterBurnBalanceInContToken = bigNumberToNumber( await benjaminsContract.balanceOf(callingAccAddress) );
  //console.log(`Token balance of deployer after burning ${amountOfTokensForFirstSpecifiedBurn} tokens:`, afterFirstBurnBalanceInContToken);

  // after burning ${amountOfTokensForFirstSpecifiedBurn} tokens, querying benjamins total supply
  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() );    
  

  const callingAccUSDCBalanceAfterBurnBN = await polygonUSDC.balanceOf(callingAccAddress);
  const callingAccUSDCBalanceAfterBurnInCents = fromWEItoCents(callingAccUSDCBalanceAfterBurnBN);    
  console.log(`USDC balance of ${callingAccAddress} after ${burnName} burn:`, fromCentsToUSDC(callingAccUSDCBalanceAfterBurnInCents) );        

  const contractUSDCBalanceAfterBurnBN = await polygonUSDC.balanceOf(benjaminsContract.address);
  const contractUSDCBalanceAfterBurnInCents = fromWEItoCents(contractUSDCBalanceAfterBurnBN);    
  //console.log(`benjaminsContract USDC balance after ${burnName} burn:`, fromCentsToUSDC(contractUSDCBalanceAfterBurnInCents));

  const acc1USDCBalanceAfterBurnBN = await polygonUSDC.balanceOf(feeReceiverAddress);
  const acc1USDCBalanceAfterBurnInCents = fromWEItoCents(acc1USDCBalanceAfterBurnBN);    
  //console.log(`feeReceiver USDC balance after ${burnName} burn:`, fromCentsToUSDC(acc1USDCBalanceAfterBurnInCents));       

  const callingAccBurnReturnReceivedInCents = callingAccUSDCBalanceAfterBurnInCents - callingAccUSDCBalanceBeforeBurnInCents;
  const contractUSDCdiffBurnInCents = contractUSDCBalanceBeforeBurnInCents - contractUSDCBalanceAfterBurnInCents ;
  const acc1ReceiverUSDCdiffBurnInCents = acc1USDCBalanceAfterBurnInCents - acc1USDCBalanceBeforeBurnInCents;     
  
  //console.log(`benjaminsContract USDC balance before ${burnName} burn:`, fromCentsToUSDC(contractUSDCBalanceBeforeBurnInCents));
  //console.log(`benjaminsContract USDC balance after ${burnName} burn:`, fromCentsToUSDC(contractUSDCBalanceAfterBurnInCents));

  //console.log(`${callingAccAddress} USDC balance before ${burnName} burn:`, fromCentsToUSDC(callingAccUSDCBalanceBeforeBurnInCents));
  //console.log(`${callingAccAddress} USDC balance after ${burnName} burn:`, fromCentsToUSDC(callingAccUSDCBalanceAfterBurnInCents));    

  //console.log(`feeReceiver USDC balance before ${burnName} burn:`, fromCentsToUSDC(acc1USDCBalanceBeforeBurnInCents));
  //console.log(`feeReceiver USDC balance after ${burnName} burn:`, fromCentsToUSDC(acc1USDCBalanceAfterBurnInCents));
  
  console.log(`benjaminsContract paid out in USDC:`, fromCentsToUSDC(contractUSDCdiffBurnInCents));
  console.log(`${callingAccAddress} burn return received in USDC:`, fromCentsToUSDC(callingAccBurnReturnReceivedInCents));  
  console.log(`acc1 burn fee received in USDC:`, fromCentsToUSDC(acc1ReceiverUSDCdiffBurnInCents));

  console.log(`fee received should be:`, fromCentsToUSDC(contractUSDCdiffBurnInCents - callingAccBurnReturnReceivedInCents) );

  console.log(`Token total supply after ${burnName} burn, burning ${amountToBurn} tokens:`, totalSupplyAfterBurn); 

  burnReturnTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(contractUSDCdiffBurnInCents);
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
  //console.log(`========================Burn End====================================`);
   
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

      const acc5USDCBalanceOperationStart = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(normUserAddress)) );
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

      //testMinting(mintName, amountToMint, ammountToApproveInCents, callingAccAddress)
      await testMinting(`operation nr: ${opCounter}, minting`, randomAmountMinting, mintAllowanceInUSDCCentsShouldBeNowGlobalV, normUserAddress, 0);

      totalSpent += mintPriceTotalInUSDCWasPaidNowGlobalV;

      //confirmMint(nrOfTokensExisting, amountToMint)
      confirmMint(tokensExistingNow, randomAmountMinting); 

    } 


    
  }

  loopCounterTotal += (opCounter-1);
  mintCounterTotal += mintCounter;
  burnCounterTotal += burnCounter;

  

  const protocolBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(benjaminsContract.address)) );
  console.log('protocol our contract USDC balance at the end of all loops so far', protocolBalanceAfterTest);
  const protocolBalanceAfterTestJSExactness = Number(protocolBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);
  
  const acc5USDCBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(normUserAddress)) );
  console.log('acc5 user USDC balance at the end of all loops so far', acc5USDCBalanceAfterTest);
  const acc5USDCBalanceAfterTestJSExactness = Number(acc5USDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const feeReceiveracc1USDCBalanceAfterTest = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(feeReceiverAddress)) );
  console.log('feeReceiver USDC balance at the end of all loops so far', feeReceiveracc1USDCBalanceAfterTest);
  const feeReceiveracc1USDCBalanceAfterTestJSExactness = Number(feeReceiveracc1USDCBalanceAfterTest*100);
  //console.log('protocolBalanceAfterTestJSExactness', protocolBalanceAfterTestJSExactness);

  const inTotalUSDCExistafterTest = protocolBalanceAfterTestJSExactness + acc5USDCBalanceAfterTestJSExactness + feeReceiveracc1USDCBalanceAfterTestJSExactness ; 
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

    ({ deployer } = await getNamedAccounts());
    deployerSigner = await ethers.provider.getSigner(deployer);    
    
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
  
  it("1. Should show deployment went as expected", async function () {
    
    // after deployment, querying benjamins balance of deployer, logging as number and from WEI to ETH
    const startingBalanceInbenjamins = bigNumberToNumber(await benjaminsContract.balanceOf(deployer));    
    console.log("deployer has this many benjamins after deployment: ", startingBalanceInbenjamins);

    // after deployment, querying benjamins total supply
    const totalSupplyAfterDeploy = bigNumberToNumber(await benjaminsContract.totalSupply()) ;
    console.log("benjamins total supply after deployment: ", totalSupplyAfterDeploy);   

    console.log("polygonUSDC address: ", polygonUSDC.address);   
    console.log("polygonLendingPool address: ", polygonLendingPool.address);  
    console.log("polygonAmUSDC address: ", polygonAmUSDC.address);    
      
  });    

  it("2. Should impersonate MATIC-heavy account and send MATIC to deployer ", async function () {

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

    const whaleSignerAddress = whaleSigner.address;
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

    quickswapFactory = new ethers.Contract(
      quickswapFactoryAddress,
      [
        'function getPair(address tokenA, address tokenB) external view returns (address pair)',
      ], 
      deployerSigner
    );

    //function getPair(address tokenA, address tokenB) external view returns (address pair);
    const maticUSDCpairAddress = await quickswapFactory.getPair(polygonMaticAddress, polygonUSDCaddress);
    console.log('maticUSDCpairAddress:', maticUSDCpairAddress);     

    polygonWMATIC = new ethers.Contract(
      polygonWMATICAddress,
      [
        'function approve(address guy, uint wad) public returns (bool)',
        'function transfer(address dst, uint wad) public returns (bool)',
        'function deposit() public payable',        
      ], 
      deployerSigner
    );

    const deployerMaticBeforeWrapping = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC before wrapping:', deployerMaticBeforeWrapping);       

    await polygonWMATIC.deposit( {value: ethers.utils.parseEther("5000000")} );

    const deployerMaticAfterWrapping = await getMaticBalance(deployer);
    console.log('deployer has this many MATIC after wrapping:', deployerMaticAfterWrapping);
   
  });    

  it("4. Deployer should exchange MATIC for USDC on polygon via QuickSwap", async function () {
    
    //function approve(address spender, uint value) external returns (bool);
    await polygonWMATIC.approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("15000000") );

      
    const deployerUSDCbalStart2 = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    console.log('deployer has this many USDC before using DEX:', deployerUSDCbalStart2);   
        

    polygonQuickswapRouter = new ethers.Contract(
      polygonQuickswapRouterAddress,
      [
       'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',      
       'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)' 
      ], 
      deployerSigner
    );
    
    let amountMATICToSwapToUSDCInWEI = bigNumberToNumber (ethers.utils.parseEther("5000000"));   
    console.log('amountMATICToSwapToUSDCInWEI:', amountMATICToSwapToUSDCInWEI); 
    await polygonQuickswapRouter.swapExactTokensForTokens( amountMATICToSwapToUSDCInWEI, 5000000 , [polygonWMATICAddress, polygonUSDCaddress], deployer, 1665102928 );
           
    const deployerUSDCbalEnd2 = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    console.log('deployer has this many USDC after using DEX:', deployerUSDCbalEnd2);             
     
      
  });    

  
  /*
  it("5. Minting and staking", async function () {    

    const deployerUSDCbalStart3 = fromWEItoUSDC( bigNumberToNumber (await polygonUSDC.balanceOf(deployer)) );
    console.log('deployer has this many USDC before minting/staking:', deployerUSDCbalStart3);   

    const deployerBNJIbalStart3 = bigNumberToNumber(await benjaminsContract.balanceOf(deployer));    
    console.log("deployer directly owns/controls this many BNJI before minting/staking:", deployerBNJIbalStart3);

    const deployerBNJIstakedStart3 = bigNumberToNumber(await benjaminsContract.checkOwnedBenjamins(deployer));    
    console.log("deployer is staking this many BNJI before minting/staking:", deployerBNJIstakedStart3);

    const benjaminsContractBeforeStakingTokens = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address));    
    console.log("benjaminsContract owns/manages this many benjamins before anybody staked:", benjaminsContractBeforeStakingTokens);

    // args: testMinting(mintName, amountToMint, ammountToApproveInCents, callingAccAddress) 
    //await testMinting("first", 10000, 12625, deployer, 1);
    //confirmMint(0, 10000); 

    const deployerBNJIbalEnd3 = bigNumberToNumber(await benjaminsContract.balanceOf(deployer));    
    console.log("deployer directly owns/controls this many BNJI after minting/staking:", deployerBNJIbalEnd3);

    const deployerBNJIstakedEnd3 = bigNumberToNumber(await benjaminsContract.checkOwnedBenjamins(deployer));    
    console.log("deployer is staking this many BNJI after minting/staking:", deployerBNJIstakedEnd3);

    const benjaminsContractAfterStakingTokens = bigNumberToNumber(await benjaminsContract.balanceOf(benjaminsContract.address));    
    console.log("benjaminsContract owns/manages this many benjamins before staking:", benjaminsContractAfterStakingTokens);


    

  });
  
  it("5. Staking results test", async function () {    

    
    const acc0Staked = bigNumberToNumber( await benjaminsContract.checkStakedBenjamins(deployer));
    console.log("deployer is staking in total: ", acc0Staked);

    const acc0StakedArray = await benjaminsContract.checkStakedArrayOfUser(deployer);
    //console.log("deployer's staking array: ", acc0StakedArray);

    

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
    //);  

  });*/
}); 
