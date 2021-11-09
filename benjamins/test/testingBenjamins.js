const { expect } = require("chai");
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

let testUserAddressesArray = [];

const baseFee = 2;
const levelDiscountsArray = [ 0,  5, 10,  20,  40,   75];       

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

let polygonLendingPool;
const polygonLendingPoolAddress = '0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf';

let testUser_1_Signer;
let testUser_2_Signer;

let user1LevelDataArray = [];
let user1DiscountDataArray = [];
let user2LevelDataArray = [];
let user2DiscountDataArray = [];

// querrying and saving account level and account discount info for userToCheck, and saving them to an array for later confirmation
async function addUserAccDataPoints(userToCheck){
 
  const userLevelNow = bigNumberToNumber (await benjaminsContract.discountLevel(userToCheck));
  
  const userDiscountNow = 100 - bigNumberToNumber( await benjaminsContract.quoteFeePercentage(userToCheck)/100/baseFee);
    
  if (userToCheck == testUser_1){
    user1LevelDataArray.push(userLevelNow);
    user1DiscountDataArray.push(userDiscountNow);
  } else if (userToCheck == testUser_2) {
    user2LevelDataArray.push(userLevelNow);
    user2DiscountDataArray.push(userDiscountNow);

  } 
}

// confirms account level and account discount as recorded via add addUserAccDataPoints function
function confirmUserDataPoints(userToCheck, expectedUserLevelsArray, expectedUserDiscountArray) {
  if  (userToCheck == testUser_1){
    for (let index = 0; index < user1LevelDataArray.length; index++) {
     
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

async function getMaticBalance(adress) {    
  const balanceInWEI = await ethers.provider.getBalance(adress); 
  const balanceInMATIC = Number(balanceInWEI / (10**18) );        
  return balanceInMATIC;
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

function getRoundedFee(userLevel, principalInUSDCcents){    
  const feeModifier = (100 * baseFee * (100-levelDiscountsArray[userLevel])) /10000;
  const feeStarterInCents = ((principalInUSDCcents * feeModifier ) /100);   
  const feeInCentsRoundedDown = feeStarterInCents - (feeStarterInCents % 1);
  return feeInCentsRoundedDown  
}

async function depositAdditionalUSDC(amountUSDCin6dec) {
  await polygonUSDC.connect(deployerSigner).approve(polygonLendingPoolAddress, amountUSDCin6dec);  
  await polygonLendingPool.connect(deployerSigner).deposit(polygonUSDCaddress, amountUSDCin6dec, benjaminsContract.address, 0);       
}

async function testTransfer(amountBNJIsToTransfer, callingAccAddress, receivingAddress){
  
  const feeReceiverUSDCBalanceBeforeTransferIn6dec = await balUSDCin6decBN(feeReceiver);

  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  const feeInCentsRoundedDown = await calcBurnVariables(amountBNJIsToTransfer, callingAccAddress, true);  
 
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, multiplyFromUSDCcentsTo6dec(feeInCentsRoundedDown));
  // calling transfer function on benjaminscontract  
  await benjaminsContract.connect(callingAccSigner).transfer(receivingAddress, amountBNJIsToTransfer);

  const feeReceiverUSDCBalancAfterTransferIn6dec = await balUSDCin6decBN(feeReceiver);

  transferFeeWasPaidNowInUSDCcentsGlobalV = dividefrom6decToUSDCcents(bigNumberToNumber(feeReceiverUSDCBalancAfterTransferIn6dec - feeReceiverUSDCBalanceBeforeTransferIn6dec));

  expect(transferFeeShouldBeNowInUSDCcentsGlobalV).to.equal( Number (transferFeeWasPaidNowInUSDCcentsGlobalV)); 
}

async function testMinting(mintName, amountToMint, callingAccAddress, receivingAddress) {

  const callingAccUSDCBalanceBeforeMintInCents = await balUSDCinCents(callingAccAddress);  
  const feeReceiverUSDCBalanceBeforeMintInCents = await balUSDCinCents(feeReceiver);  
  
  // allowing benjaminsContract to handle USDC for ${callingAcc}   
  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);
  
  const restAllowanceToBNJIcontractIn6dec = await polygonUSDC.allowance(callingAccAddress, benjaminsContract.address);
  expect(await restAllowanceToBNJIcontractIn6dec).to.equal(0);
  
  const amountToApproveIn6dec = await calcMintApprovalAndPrep(amountToMint, callingAccAddress);  
  await polygonUSDC.connect(callingAccSigner).approve(benjaminsContract.address, amountToApproveIn6dec);
  
  const givenAllowanceToBNJIcontractIn6dec = await polygonUSDC.connect(callingAccSigner).allowance(callingAccAddress, benjaminsContract.address);
  
  expect(Number (amountToApproveIn6dec)).to.equal(Number (givenAllowanceToBNJIcontractIn6dec));
  
  // descr: function mintTo(uint256 _amount, address _toWhom) public whenAvailable {  
  await benjaminsContract.connect(callingAccSigner).mintTo(amountToMint, receivingAddress);  

  const totalSupplyAfterMint = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
 

  const callingAccUSDCBalanceAfterMintInCents = await balUSDCinCents(callingAccAddress);   
  const feeReceiverUSDCBalanceAfterMintInCents = await balUSDCinCents(feeReceiver); 
 
  const callingAccMintPricePaidInCents = callingAccUSDCBalanceBeforeMintInCents - callingAccUSDCBalanceAfterMintInCents;
 
  const feeReceiverUSDCdiffMintInCents = feeReceiverUSDCBalanceAfterMintInCents - feeReceiverUSDCBalanceBeforeMintInCents;     
  
  
  mintPriceTotalInUSDCWasPaidNowGlobalV = fromCentsToUSDC(callingAccMintPricePaidInCents);
  mintFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffMintInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterMint;
  mintAllowanceInUSDCCentsWasNowGlobalV = dividefrom6decToUSDCcents(givenAllowanceToBNJIcontractIn6dec);

  confirmMint();
};

async function testBurning(burnName, amountToBurn, callingAccAddress, receivingAddress) { 

  const receivingAddressUSDCBalanceBeforeBurnInCents = await balUSDCinCents(receivingAddress); 
  const feeReceiverUSDCBalanceBeforeBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const contractAMUSDCbalanceBeforeBurnInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));

  const callingAccSigner = await ethers.provider.getSigner(callingAccAddress);

  await calcBurnVariables(amountToBurn, callingAccAddress);

  // descr: function burnTo(uint256 _amount, address _toWhom)
  await benjaminsContract.connect(callingAccSigner).burnTo(amountToBurn, receivingAddress);    

  const totalSupplyAfterBurn = bigNumberToNumber( await benjaminsContract.totalSupply() ); 
  const receivingAccUSDCBalanceAfterBurnInCents = await balUSDCinCents(receivingAddress); 
   
  
  const feeReceiverUSDCBalanceAfterBurnInCents = await balUSDCinCents(feeReceiver); 
  
  const receivingAccBurnReturnReceivedInCents = receivingAccUSDCBalanceAfterBurnInCents - receivingAddressUSDCBalanceBeforeBurnInCents;  
  const feeReceiverUSDCdiffBurnInCents = feeReceiverUSDCBalanceAfterBurnInCents - feeReceiverUSDCBalanceBeforeBurnInCents;       

  burnReturnWOfeeInUSDCWasPaidNowGlobalV = fromCentsToUSDC(receivingAccBurnReturnReceivedInCents);
  burnFeeInUSDCWasPaidNowGlobalV = feeReceiverUSDCdiffBurnInCents/100;
  tokensExistQueriedGlobalV = totalSupplyAfterBurn;

  confirmBurn();
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
  
  expect(tokensShouldExistNowGlobalV).to.equal( Number (tokensExistQueriedGlobalV));
  expect(mintPriceTotalInUSDCShouldBeNowGlobalV).to.equal(Number (mintPriceTotalInUSDCWasPaidNowGlobalV));
  expect(mintFeeInUSDCShouldBeNowGlobalV).to.equal(Number (mintFeeInUSDCWasPaidNowGlobalV));
  expect(mintAllowanceInUSDCCentsShouldBeNowGlobalV).to.equal(Number (mintAllowanceInUSDCCentsWasNowGlobalV));
};

function confirmBurn(){  
  
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

  // results, toPayTotalInUSDC can be displayed to user
  const toPayTotalInCents = mintingCostRoundedDownInCents + mintFeeInCentsRoundedDown;
  const toPayTotalInUSDC = toPayTotalInCents / 100;
  const toPayTotalIn6dec = toPayTotalInCents * 10000;    

  tokensShouldExistNowGlobalV = amountOfTokensAfterMint;
  mintPriceTotalInUSDCShouldBeNowGlobalV = toPayTotalInUSDC;
  mintFeeInUSDCShouldBeNowGlobalV = mintFeeInCentsRoundedDown/100;
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
    burnReturnWOfeeInUSDCShouldBeNowGlobalV = toReceiveTotalInUSDC;
    burnFeeInUSDCShouldBeNowGlobalV = burnFeeInCentsRoundedDown/100;
  } else {
    transferFeeShouldBeNowInUSDCcentsGlobalV = burnFeeInCentsRoundedDown;
    return burnFeeInCentsRoundedDown;
  }  
}



describe("Benjamins Test", function () {

  // setting instances of contracts
  beforeEach(async function() {   

    ({ deployer, feeReceiver, accumulatedReceiver, testUser_1, testUser_2, testUser_3, testUser_4, testUser_5 } = await getNamedAccounts());

    
    deployerSigner = await ethers.provider.getSigner(deployer);   
    testUser_1_Signer = await ethers.provider.getSigner(testUser_1); 
    testUser_2_Signer = await ethers.provider.getSigner(testUser_2); 

    testUserAddressesArray.push(testUser_1);
    testUserAddressesArray.push(testUser_2);
    testUserAddressesArray.push(testUser_3);
    testUserAddressesArray.push(testUser_4);
    testUserAddressesArray.push(testUser_5);    
    
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
        
    await polygonWMATIC.approve( polygonQuickswapRouterAddress, ethers.utils.parseEther("15000000") );

    const amountToReceiveUSDCIn6dec = 1000000 * (10**6) //ethers.utils.parseEther("1000000");
    const amountInMaxInWEI = ethers.utils.parseEther("4000000"); //4000000 * (10**18);   
    await polygonQuickswapRouter.swapTokensForExactTokens( amountToReceiveUSDCIn6dec, amountInMaxInWEI , [polygonWMATICaddress, polygonUSDCaddress], deployer, 1665102928);  
                 
    await benjaminsContract.connect(deployerSigner).unpause(); 

    resetTrackers();
    
    await testMinting("First Setup mint for 100k USDC", 282840, deployer, deployer);    
        
    for (let index = 0; index < 2; index++) {
      const testingUser = testUserAddressesArray[index];

      await deployerSigner.sendTransaction({
        to: testingUser,
        value: ethers.utils.parseEther("10") // 10 Matic
      })

      if (testingUser == testUser_1){
        await polygonUSDC.connect(deployerSigner).transfer(testingUser, (3000*scale6dec) );
      }       
    } 

    polygonLendingPool = new ethers.Contract(
      polygonLendingPoolAddress,
      [
        'function getUserAccountData(address user) external view returns ( uint256 totalCollateralETH, uint256 totalDebtETH, uint256 availableBorrowsETH, uint256 currentLiquidationThreshold, uint256 ltv, uint256 healthFactor)',
        'function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode ) external'
      ], 
      deployerSigner
    );  
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
      
  it("Test 3. Owner can pause and unpause contract", async function () {

   // BenjaminsContract is unpaused in the beginning
   expect(await benjaminsContract.paused()).to.equal(false);

   // Owner can pause contract
   await benjaminsContract.connect(deployerSigner).pause();

   // BenjaminsContract is now paused
   expect(await benjaminsContract.paused()).to.equal(true);
   
   // Owner can unpause contract
   await benjaminsContract.connect(deployerSigner).unpause();

   // BenjaminsContract is now unpaused again
   expect(await benjaminsContract.paused()).to.equal(false);
  });
  
  
  it.only("Test 4. Owner can withdraw MATIC and ERC20 tokens that were sent to the contract directly, by mistake", async function () { 

    const contractMaticStart = await getMaticBalance(benjaminsContract.address);  
    const deployerMaticStart = await getMaticBalance(deployer);
    const deployerMaticStartRounded = deployerMaticStart - (deployerMaticStart%1); 
    console.log(deployerMaticStartRounded, 'deployerMaticStartRounded');

    expect(contractMaticStart).to.equal(0); 
    
    await deployerSigner.sendTransaction({
      to: benjaminsContract.address,
      value: ethers.utils.parseEther("20") // 20 Matic
    })

    const contractMaticAfterSend = await getMaticBalance(benjaminsContract.address); 
    expect(contractMaticAfterSend).to.equal(contractMaticStart+20); 

    const deployerMaticAfterSend = await getMaticBalance(deployer);
    const deployerMaticcAfterSendRounded = deployerMaticAfterSend - (deployerMaticAfterSend%1);
    expect(deployerMaticcAfterSendRounded).to.equal(deployerMaticStartRounded-20);    
    console.log(deployerMaticcAfterSendRounded, 'deployerMaticcAfterSendRounded'); 
    
    await benjaminsContract.connect(deployerSigner).cleanTips();
  
    const contractMaticAfterCleanedTips = await getMaticBalance(benjaminsContract.address); 
    expect(contractMaticAfterCleanedTips).to.equal(0); 

    const deployerMaticAfterCleanedTips = await getMaticBalance(deployer);
    const deployerMaticcAfterCleanedTipsRounded = deployerMaticAfterCleanedTips - (deployerMaticAfterCleanedTips%1);
    expect(deployerMaticcAfterCleanedTipsRounded).to.equal(deployerMaticcAfterSendRounded+20);
    console.log(deployerMaticcAfterCleanedTipsRounded, 'deployerMaticcAfterCleanedTipsRounded');

    
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
    await testMinting("Test 16.1, minting 25 BNJI to caller", 25, testUser_1, testUser_1);    
    
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
    await testMinting("Test 17.1, minting 25 BNJI to caller", 25, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(25);       
    await addUserAccDataPoints(testUser_1);  
    await mintBlocks(1); 

    await testMinting("Test 17.2, minting 75 BNJI to caller", 75, testUser_1, testUser_1);    
    
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
    await mintBlocks(60); 

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
      
  });  
  
  it("Test 21. Should first REVERT: testUser_1 tries to transfer tokens before holding period ends, then correctly", async function () {   

    await addUserAccDataPoints(testUser_1); 
    await addUserAccDataPoints(testUser_2); 

    await testMinting("Test 21, minting 60 BNJI to caller", 60, testUser_1, testUser_1);    
    
    expect(await balBNJI(testUser_1)).to.equal(60);
    expect(await balBNJI(testUser_2)).to.equal(0);

    await addUserAccDataPoints(testUser_1);   
    await mintBlocks(10);  

    await expect( testTransfer(30, testUser_1, testUser_2) ).to.be.revertedWith(
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
  
    await testBurning("Test 22.2, burning 570 tokens after needed amount of blocks", 570, testUser_1, testUser_1);     

    expect(await balBNJI(testUser_1)).to.equal(30);  
    await addUserAccDataPoints(testUser_1); 

    const expectedUser1Levels = [0,4,1];
    const expectedUser1Discounts = [0,40,5];        
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);        
  });  
  
  it("Test 23. Downgrading accounts works as intended", async function () { 

    expect(await balBNJI(testUser_1)).to.equal(0); 
    await addUserAccDataPoints(testUser_1);        

    await testMinting("Test 23.1, minting 2000 BNJI to caller", 2000, testUser_1, testUser_1);  

    expect(await balBNJI(testUser_1)).to.equal(2000); 
    await addUserAccDataPoints(testUser_1);
    await mintBlocks(10);  

    await expect(testBurning("Test 23.2, burning 1500 tokens, too early", 1500, testUser_1, testUser_1)).to.be.revertedWith(
      "Discount level withdraw timeout in effect."
    );

    expect(await balBNJI(testUser_1)).to.equal(2000); 

    await mintBlocks(720);  
    await testBurning("Test 23.3, burning 1500 tokens, after needed blocks", 1500, testUser_1, testUser_1);

    expect(await balBNJI(testUser_1)).to.equal(500); 
    await addUserAccDataPoints(testUser_1);
    
    await testBurning("Test 23.4, burning 400 tokens, no extra waiting needed", 400, testUser_1, testUser_1);
    
    expect(await balBNJI(testUser_1)).to.equal(100); 
    await addUserAccDataPoints(testUser_1);

    await testBurning("Test 23.5, burning 40 tokens, no extra waiting needed", 40, testUser_1, testUser_1);
    
    expect(await balBNJI(testUser_1)).to.equal(60); 
    await addUserAccDataPoints(testUser_1);

    await testBurning("Test 23.6, burning 40 tokens, no extra waiting needed", 40, testUser_1, testUser_1);
    
    expect(await balBNJI(testUser_1)).to.equal(20); 
    await addUserAccDataPoints(testUser_1);

    await testBurning("Test 23.7, burning 40 tokens, no extra waiting needed", 20, testUser_1, testUser_1);
      
    await addUserAccDataPoints(testUser_1);  
    expect(await balBNJI(testUser_1)).to.equal(0);         

    const expectedUser1Levels = [0,5,4,3,2,1,0];
    const expectedUser1Discounts = [0,75,40,20,10,5,0];          
    confirmUserDataPoints(testUser_1, expectedUser1Levels, expectedUser1Discounts);   
    
  });
  
  it("Test 24. Activating pause() should lock public access to state changing functions, but allow owner.", async function () { 
    
    // setup for test, testUser_1 mints 510 BNJIs and waits 180 blocks,
    // after that, user would normally be able to transfer, burn etc
    await addUserAccDataPoints(testUser_1);        
    await testMinting("Test 24.1, minting 510 BNJI to caller", 510, testUser_1, testUser_1);  
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
    expect(await benjaminsContract.paused()).to.equal(false);
    
  });

  it("Test 25. Owner can add additional funds to contract's amUSDC balance", async function () { 
    // getting contracts amUSDC balance
    const contractAMUSDCbalBeforeInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
    // since it constantly changes in tiny amounts, due to accruing interest, rounding it down to whole cents
    const beforeRoundedToCents = contractAMUSDCbalBeforeInCents - (contractAMUSDCbalBeforeInCents%1); 
    expect(beforeRoundedToCents).to.equal(9999808);
    // owner deposits an extra $100 USDC into the lending pool on contracts behalf
    await depositAdditionalUSDC(100*scale6dec);
    // rounding down new amUSDC balance, same reasoning and comparing
    const contractAMUSDCbalAfterInCents = dividefrom6decToUSDCcents (bigNumberToNumber (await polygonAmUSDC.balanceOf(benjaminsContract.address)));
    const afterRoundedToCents = contractAMUSDCbalAfterInCents - (contractAMUSDCbalAfterInCents%1); 
    // expecting that the new balance is $100 bigger than the old one
    expect(afterRoundedToCents).to.equal(beforeRoundedToCents+10000);  
  });


  it("Test 26. All tokens that exist can be burned, and the connected USDC paid out by the protocol", async function () { 

    for (let index = 0; index < testUserAddressesArray.length; index++) {
      const callingAcc = testUserAddressesArray[index];

      const balanceBNJI = await balBNJI(callingAcc);

      if (balanceBNJI>0){
        await testBurning(`Endburn from testUser_${index}`, balanceBNJI, callingAcc, callingAcc);
        expect(await balBNJI(callingAcc)).to.equal(0);
      }    
    }

    await mintBlocks(720);

    const balBNJIdeployer = await balBNJI(deployer);
    await testBurning(`Endburn from deployer`, balBNJIdeployer, deployer, deployer);

    expect(await balBNJI(deployer)).to.equal(0);

    const totalSupplyExisting = bigNumberToNumber(await benjaminsContract.totalSupply()); 
    expect(totalSupplyExisting).to.equal(0);
  });

  // TODO put in reentrancy guard test
}); 
