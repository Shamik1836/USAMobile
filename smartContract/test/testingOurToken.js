const { expect } = require("chai");
const { ethers } = require("hardhat");

// Customized helpers

// helper variable, to check addresses in a format that is easier to read
// this array will receive the generated Hardhat addresses,
// i.e. accountToHHAddressArray[0] will hold the address of accounts[0]
// can be queried by findAccountForHHAddress
let accountToHHAddressArray = [];

let tokensShouldExistNowGlobalV;
let mintPriceTotalInUSDCShouldBeNowGlobalV; 
let mintAllowanceInUSDCCentsShouldBeNowGlobalV;
let burnReturnTotalInUSDCShouldBeNowGlobalV;

let tokensExistQueriedGlobalV;
let mintPriceTotalInUSDCWasPaidNowGlobalV;
let mintAllowanceInUSDCCentsWasNowGlobalV;
let burnReturnTotalInUSDCWasPaidNowGlobalV;


let loopCounterTotal = 0;
let mintCounterTotal = 0;
let burnCounterTotal = 0;

let totalSpent = 0;
let totalReturned = 0;

// helper function to console.log for testing/debugging: looking up the accounts[] variable for an address 
function findAccountForHHAddress(addressToLookup){
  for (let findInd = 0; findInd < accountToHHAddressArray.length; findInd++) {
    if (accountToHHAddressArray[findInd] == addressToLookup) {
      return "accounts[" +`${findInd}`+ "]"
    } else if (addressToLookup== '0x0000000000000000000000000000000000000000' ) {
      return "Zero address: 0x0000000000000000000000000000000000000000 => it was burnt"      
    }   
  }  
}; 

// converting BN big numbers to normal numbers
function bigNumberToNumber(bignumber) {
  let convertedNumber = (ethers.utils.formatUnits(bignumber, 0)).toString();  
  return convertedNumber;
}

// converting ETH to WEI
function fromETHtoWEI (numberInETH) {
  const numberInWEI = web3.utils.toWei(numberInETH.toString());
  return numberInWEI;
}

// converting WEI to USDC
function fromWEItoUSDC (numberInWEI) {
  const numberInUSDC = Number( web3.utils.fromWei(numberInWEI.toString()));      
  return numberInUSDC;    
}

// converting WEI to Cents
function fromWEItoCents (numberInWEI) {
  const numberInCents = Number (ethers.utils.formatUnits(numberInWEI, 16));      
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

/* // querying address' ETH balance
  // querying address' ETH balance and converting from WEI to ETH and into normal number
  async function getETHbalance(adress) {    
    const balanceInWEI = await ethers.provider.getBalance(adress); 
    const balanceInETH = fromWEItoETH(balanceInWEI);        
    return balanceInETH;
  }
*/

async function testMinting(mintName, amountToMint, ammountToApproveInCents, callingAcc, nrOfFaucetCalls) {

  const ammountToApproveInWEI = fromCentstoWEI(ammountToApproveInCents); 
  const callingAccountName = findAccountForHHAddress(callingAcc.address);
  
  /*
    // REVERT: trying to mint tokens without enough mockUSDC 
    await expect( ourTokenContract.connect(callingAcc).specifiedMint(amountToMint) ).to.be.revertedWith(
      "Not enough mockUSDC"
    );   
  */  
  /*
  // accounts[0] gets mockUSDC to pay minting
  for (let faucetCall = 0; faucetCall < nrOfFaucetCalls ; faucetCall++) {    
    await mockUSDCTokenContract.connect(callingAcc).getmockUSDC();    
  }   */
  
  const callingAccMockUSDCBalanceBeforeMintBN = await mockUSDCTokenContract.balanceOf(callingAcc.address);
  const callingAccMockUSDCBalanceBeforeMintInCents = fromWEItoCents(callingAccMockUSDCBalanceBeforeMintBN);  
  const callingAccMockUSDCBalanceBeforeMintInUSDC = fromCentsToUSDC(callingAccMockUSDCBalanceBeforeMintInCents);
  //console.log(`mockUSDC balance of ${callingAccountName} before ${mintName} `, callingAccMockUSDCBalanceBeforeMintInUSDC);        

  //mint, ${callingAccMockUSDCBalanceBeforeMintInUSDC}:`, callingAccMockUSDCBalanceBeforeMintInUSDC

  const contractMockUSDCBalanceBeforeMintBN = await mockUSDCTokenContract.balanceOf(ourTokenContract.address);
  const contractMockUSDCBalanceBeforeMintInCents = fromWEItoCents(contractMockUSDCBalanceBeforeMintBN);    
  //console.log(`ourTokenContract mockUSDC balance before ${mintName} mint:`, fromCentsToUSDC(contractMockUSDCBalanceBeforeFirstMintInCents));

  const acc1MockUSDCBalanceBeforeMintBN = await mockUSDCTokenContract.balanceOf(accounts[1].address);
  const acc1MockUSDCBalanceBeforeMintInCents = fromWEItoCents(acc1MockUSDCBalanceBeforeMintBN);    
  //console.log(`feeReceiver acc1 mockUSDC balance before ${mintName} mint:`, fromCentsToUSDC(acc1MockUSDCBalanceBeforeFirstMintInCents));

  /*
    // REVERT: trying to to mint tokens without giving the contract allowance for mockUSDC 
    await expect( ourTokenContract.connect(callingAcc).specifiedMint(amountToMint) ).to.be.revertedWith(
      "Not enough allowance in mockUSDC for payment"
    );   
  */    

  // allowing ourTokenContract to handle mockUSDC for ${callingAcc}    
  await mockUSDCTokenContract.connect(callingAcc).approve(ourTokenContract.address, ammountToApproveInWEI);

  // minting ${amountOfTokensForFirstSpecifiedMint} tokens
  await ourTokenContract.connect(callingAcc).specifiedMint(amountToMint);

  // after minting ${amountOfTokensForFirstSpecifiedMint} tokens, querying ourToken balance of accounts[0], logging as number and from WEI to ETH
  const callingAccAfterMintBalanceInContToken = bigNumberToNumber( await ourTokenContract.balanceOf(callingAcc.address) );
  //console.log(`Token balance of accounts[0] after minting ${amountOfTokensForFirstSpecifiedMint} tokens:`, afterFirstMintBalanceInContToken);

  // after minting ${amountOfTokensForFirstSpecifiedMint} tokens, querying ourToken total supply
  const totalSupplyAfterMint = bigNumberToNumber( await ourTokenContract.totalSupply() ); 


  const callingAccMockUSDCBalanceAfterMintBN = await mockUSDCTokenContract.balanceOf(callingAcc.address);
  const callingAccMockUSDCBalanceAfterMintInCents = fromWEItoCents(callingAccMockUSDCBalanceAfterMintBN);    
  //console.log(`mockUSDC balance of ${callingAccountName} after ${mintName}:`, fromCentsToUSDC(callingAccMockUSDCBalanceAfterMintInCents) );        

  const contractMockUSDCBalanceAfterMintBN = await mockUSDCTokenContract.balanceOf(ourTokenContract.address);
  const contractMockUSDCBalanceAfterMintInCents = fromWEItoCents(contractMockUSDCBalanceAfterMintBN);    
  //console.log(`ourTokenContract mockUSDC balance after ${mintName} mint:`, fromCentsToUSDC(contractMockUSDCBalanceAfterMintInCents));

  const acc1MockUSDCBalanceAfterMintBN = await mockUSDCTokenContract.balanceOf(accounts[1].address);
  const acc1MockUSDCBalanceAfterMintInCents = fromWEItoCents(acc1MockUSDCBalanceAfterMintBN);    
  //console.log(`feeReceiver acc1 mockUSDC balance after ${mintName} mint:`, fromCentsToUSDC(acc1MockUSDCBalanceAfterMintInCents));       

  const callingAccMintPricePaidInCents = callingAccMockUSDCBalanceBeforeMintInCents - callingAccMockUSDCBalanceAfterMintInCents;
  const contractUSDCdiffMintInCents = contractMockUSDCBalanceAfterMintInCents - contractMockUSDCBalanceBeforeMintInCents;
  const acc1ReceiverUSDCdiffMintInCents = acc1MockUSDCBalanceAfterMintInCents - acc1MockUSDCBalanceBeforeMintInCents;     
  
  //console.log(`ourTokenContract mockUSDC balance before ${mintName}:`, fromCentsToUSDC(contractMockUSDCBalanceBeforeMintInCents));
  //console.log(`ourTokenContract mockUSDC balance after ${mintName}:`, fromCentsToUSDC(contractMockUSDCBalanceAfterMintInCents));

  //console.log(`${callingAccountName} mockUSDC balance before ${mintName}:`, fromCentsToUSDC(callingAccMockUSDCBalanceBeforeMintInCents));
  //console.log(`${callingAccountName} mockUSDC balance after ${mintName}:`, fromCentsToUSDC(callingAccMockUSDCBalanceAfterMintInCents));    

  //console.log(`feeReceiver acc1 mockUSDC balance before ${mintName}:`, fromCentsToUSDC(acc1MockUSDCBalanceBeforeMintInCents));
  //console.log(`feeReceiver acc1 mockUSDC balance after ${mintName}:`, fromCentsToUSDC(acc1MockUSDCBalanceAfterMintInCents));
  
  console.log(`${callingAccountName} mint price paid in mockUSDC:`, fromCentsToUSDC(callingAccMintPricePaidInCents));
  console.log(`ourTokenContract return received in mockUSDC:`, fromCentsToUSDC(contractUSDCdiffMintInCents));
  console.log(`acc1 mint fee received in mockUSDC:`, fromCentsToUSDC(acc1ReceiverUSDCdiffMintInCents));

  console.log(`fee received should be:`, fromCentsToUSDC(callingAccMintPricePaidInCents - contractUSDCdiffMintInCents) );

  console.log(`Token total supply after ${mintName} ${amountToMint} tokens:`, totalSupplyAfterMint); 

  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = ammountToApproveInCents;

};

async function testBurning(burnName, amountToBurn, callingAcc) {

  const callingAccountName = findAccountForHHAddress(callingAcc.address);
 
  const callingAccMockUSDCBalanceBeforeBurnBN = await mockUSDCTokenContract.balanceOf(callingAcc.address);
  const callingAccMockUSDCBalanceBeforeBurnInCents = fromWEItoCents(callingAccMockUSDCBalanceBeforeBurnBN);  
  const callingAccMockUSDCBalanceBeforeBurnInUSDC = fromCentsToUSDC(callingAccMockUSDCBalanceBeforeBurnInCents);
  console.log(`mockUSDC balance of ${callingAccountName} before ${burnName} burn:`, callingAccMockUSDCBalanceBeforeBurnInUSDC);        

  const contractMockUSDCBalanceBeforeBurnBN = await mockUSDCTokenContract.balanceOf(ourTokenContract.address);
  const contractMockUSDCBalanceBeforeBurnInCents = fromWEItoCents(contractMockUSDCBalanceBeforeBurnBN);    
  //console.log(`ourTokenContract mockUSDC balance before ${burnName} burn:`, fromCentsToUSDC(contractMockUSDCBalanceBeforeFirstBurnInCents));

  const acc1MockUSDCBalanceBeforeBurnBN = await mockUSDCTokenContract.balanceOf(accounts[1].address);
  const acc1MockUSDCBalanceBeforeBurnInCents = fromWEItoCents(acc1MockUSDCBalanceBeforeBurnBN);    
  //console.log(`feeReceiver acc1 mockUSDC balance before ${burnName} burn:`, fromCentsToUSDC(acc1MockUSDCBalanceBeforeFirstBurnInCents));

  // burning ${amountOfTokensForFirstSpecifiedBurn} tokens
  await ourTokenContract.connect(callingAcc).specifiedBurn(amountToBurn);

  // after burning ${amountOfTokensForFirstSpecifiedBurn} tokens, querying ourToken balance of accounts[0], logging as number and from WEI to ETH
  const callingAccAfterBurnBalanceInContToken = bigNumberToNumber( await ourTokenContract.balanceOf(callingAcc.address) );
  //console.log(`Token balance of accounts[0] after burning ${amountOfTokensForFirstSpecifiedBurn} tokens:`, afterFirstBurnBalanceInContToken);

  // after burning ${amountOfTokensForFirstSpecifiedBurn} tokens, querying ourToken total supply
  const totalSupplyAfterBurn = bigNumberToNumber( await ourTokenContract.totalSupply() );    
  

  const callingAccMockUSDCBalanceAfterBurnBN = await mockUSDCTokenContract.balanceOf(callingAcc.address);
  const callingAccMockUSDCBalanceAfterBurnInCents = fromWEItoCents(callingAccMockUSDCBalanceAfterBurnBN);    
  console.log(`mockUSDC balance of ${callingAccountName} after ${burnName} burn:`, fromCentsToUSDC(callingAccMockUSDCBalanceAfterBurnInCents) );        

  const contractMockUSDCBalanceAfterBurnBN = await mockUSDCTokenContract.balanceOf(ourTokenContract.address);
  const contractMockUSDCBalanceAfterBurnInCents = fromWEItoCents(contractMockUSDCBalanceAfterBurnBN);    
  //console.log(`ourTokenContract mockUSDC balance after ${burnName} burn:`, fromCentsToUSDC(contractMockUSDCBalanceAfterBurnInCents));

  const acc1MockUSDCBalanceAfterBurnBN = await mockUSDCTokenContract.balanceOf(accounts[1].address);
  const acc1MockUSDCBalanceAfterBurnInCents = fromWEItoCents(acc1MockUSDCBalanceAfterBurnBN);    
  //console.log(`feeReceiver acc1 mockUSDC balance after ${burnName} burn:`, fromCentsToUSDC(acc1MockUSDCBalanceAfterBurnInCents));       

  const callingAccBurnReturnReceivedInCents = callingAccMockUSDCBalanceAfterBurnInCents - callingAccMockUSDCBalanceBeforeBurnInCents;
  const contractUSDCdiffBurnInCents = contractMockUSDCBalanceBeforeBurnInCents - contractMockUSDCBalanceAfterBurnInCents ;
  const acc1ReceiverUSDCdiffBurnInCents = acc1MockUSDCBalanceAfterBurnInCents - acc1MockUSDCBalanceBeforeBurnInCents;     
  
  //console.log(`ourTokenContract mockUSDC balance before ${burnName} burn:`, fromCentsToUSDC(contractMockUSDCBalanceBeforeBurnInCents));
  //console.log(`ourTokenContract mockUSDC balance after ${burnName} burn:`, fromCentsToUSDC(contractMockUSDCBalanceAfterBurnInCents));

  //console.log(`${callingAccountName} mockUSDC balance before ${burnName} burn:`, fromCentsToUSDC(callingAccMockUSDCBalanceBeforeBurnInCents));
  //console.log(`${callingAccountName} mockUSDC balance after ${burnName} burn:`, fromCentsToUSDC(callingAccMockUSDCBalanceAfterBurnInCents));    

  //console.log(`feeReceiver acc1 mockUSDC balance before ${burnName} burn:`, fromCentsToUSDC(acc1MockUSDCBalanceBeforeBurnInCents));
  //console.log(`feeReceiver acc1 mockUSDC balance after ${burnName} burn:`, fromCentsToUSDC(acc1MockUSDCBalanceAfterBurnInCents));
  
  console.log(`ourTokenContract paid out in mockUSDC:`, fromCentsToUSDC(contractUSDCdiffBurnInCents));
  console.log(`${callingAccountName} burn return received in mockUSDC:`, fromCentsToUSDC(callingAccBurnReturnReceivedInCents));  
  console.log(`acc1 burn fee received in mockUSDC:`, fromCentsToUSDC(acc1ReceiverUSDCdiffBurnInCents));

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


describe("OurToken Test", function () {

  // setting instances of contracts
  before(async function() {
   
    // get all accounts from Hardhat
    accounts = await ethers.getSigners();

    // making a copy of the account addresses to accountToHHAddressArray
    for (let accIndex = 0; accIndex < accounts.length ; accIndex++) {
      accountToHHAddressArray[accIndex] = accounts[accIndex].address;        
    }  
    
    // deploying the mockUSDCToken smart contract to Hardhat testnet
    _mockUSDCTokenInstance = await ethers.getContractFactory('MockUSDCToken');    
    mockUSDCTokenContract = await _mockUSDCTokenInstance.deploy();   

    // deploying the StakingContract smart contract to Hardhat testnet
    _stakingContractInstance = await ethers.getContractFactory('StakingContract');    
    stakingContract = await _stakingContractInstance.deploy();  

    // deploying the OurCurve smart contract to Hardhat testnet
    _OurCurveInstance = await ethers.getContractFactory('OurCurve');
    ourCurveContract = await _OurCurveInstance.deploy();  

    // deploying the ourToken smart contract to Hardhat testnet
    _ourTokenInstance = await ethers.getContractFactory('OurToken'); 
    // arguments: address _mockUSDCTokenAddress, address _feeReceiver, address _ourStakingContractInterfaceAddress
    ourTokenContract = await _ourTokenInstance.deploy( mockUSDCTokenContract.address, accounts[1].address, stakingContract.address );         

  })    
    
  it("1. Should show deployment went as expected", async function () {
    
    // after deployment, querying ourToken balance of accounts[0], logging as number and from WEI to ETH
    const startingBalanceInOurToken = bigNumberToNumber(await ourTokenContract.balanceOf(accounts[0].address));    
    //console.log("accounts[0] has this many OurToken after deployment: ", startingBalanceInContToken);

    // after deployment, querying ourToken total supply
    const totalSupplyAfterDeploy = bigNumberToNumber(await ourTokenContract.totalSupply()) ;
    //console.log("OurToken total supply after deployment: ", totalSupplyAfterDeploy);   
      
  });  

  it(`2. Staking contract, original operator and changing operator `, async function () {  

    const operatorAfterDeploy = findAccountForHHAddress( await stakingContract.operator() ) ; 
    console.log("operatorAfterDeploy: ", operatorAfterDeploy);
  
    await stakingContract.setOperator(ourTokenContract.address);
  
    const operatorChangedToOurTokenContract = await stakingContract.operator() ; 
    console.log("operatorChangedToOurTokenContract: ", operatorChangedToOurTokenContract);
    console.log("ourTokenContract.address: ", ourTokenContract.address);

    // REVERT: using setOperator as non-owner is reverted in staking contract
    await expect( stakingContract.connect(accounts[3]).setOperator(accounts[0].address) ).to.be.revertedWith(
      "Ownable: caller is not the owner"      
    );  

    

  });

  it("3. Staking prep", async function () {
    await mockUSDCTokenContract.getmockUSDC(); 

    const acc0MockUSDCBalanceAfterGetting10MStart = fromWEItoUSDC( bigNumberToNumber (await mockUSDCTokenContract.balanceOf(accounts[0].address)) );
    console.log('acc0MockUSDCBalanceAfterBigMint', acc0MockUSDCBalanceAfterGetting10MStart);   

    await testMinting("first", 10000, 12625, accounts[0], 1);
    confirmMint(0, 10000); 

    

  });

  it("4. Staking test", async function () {    

    const acc0BeforeStakingTokens = bigNumberToNumber(await ourTokenContract.balanceOf(accounts[0].address));    
    console.log("accounts[0] has this many ourToken before staking: ", acc0BeforeStakingTokens);

    const stakingContractBeforeStakingTokens = bigNumberToNumber(await ourTokenContract.balanceOf(stakingContract.address));    
    console.log("the staking contract has this many ourToken before staking: ", stakingContractBeforeStakingTokens);

   

    const tokensToStake = 800;

    console.log('accounts[0].address', accounts[0].address);

    console.log('ourTokenContract.address', ourTokenContract.address);

    

    await ourTokenContract.callDepositStake(tokensToStake);

    const acc0AfterStakingTokens = bigNumberToNumber(await ourTokenContract.balanceOf(accounts[0].address));    
    console.log("accounts[0] has this many ourToken after staking: ", acc0AfterStakingTokens);

    const stakingContractAfterStakingTokens = bigNumberToNumber(await ourTokenContract.balanceOf(stakingContract.address));    
    console.log("the staking contract has this many ourToken before staking: ", stakingContractAfterStakingTokens);

    await ourTokenContract.callWithdrawStake();
    /*
    // REVERT: using callDepositStake as non-owner is reverted in ourToken contract
    await expect( ourTokenContract.connect(accounts[3]).callDepositStake() ).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );  

    // REVERT: using depositStake directly as non-perator is reverted in staking contract
    await expect( stakingContract.connect(accounts[3]).depositStake() ).to.be.revertedWith(
      "StakingContract: caller is not the operator"
    );  */

  });
}); 
