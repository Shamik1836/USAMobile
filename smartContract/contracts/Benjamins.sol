//SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "./BNJICurve.sol";
import "./ILendingPool.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Benjamins is ERC20, BNJICurve, ReentrancyGuard {  
  using SafeMath for uint256;
 
  address public addressOfThisContract;

  address private feeReceiver; 
  address private accumulatedReceiver;    

  uint8 private amountDecimals;

  mapping (address => uint256) lastDepositBlockHeight;
  mapping (address => bool) private whitelisted;

  // amount of BNJI needed for each level;
  uint256[] levelAntes; 

  // amount of blocks necessary to pass before withdrawal is permitted
  // each level has its own requirements
  uint256[] levelHolds; 

  // percentage discount given by each level;
  uint256[] levelDiscounts; 

  uint256 antiFlashLoan = 10; // number of blocks hold to defend vs. flash loans.
  uint256 blocksPerDay = 43200;
  uint256 baseFee = 2; // in percent
 

  ILendingPool public polygonLendingPool;
  IERC20 public polygonUSDC;
  IERC20 public polygonAMUSDC;

  event SpecifiedMintEvent (address sender, address receiverOfTokens, uint256 tokenAmount, uint256 priceForMintingIn6dec);  

  event SpecifiedBurnEvent (address sender, address receiverOfUSDC, uint256 tokenAmount, uint256 returnForBurning);  

  event LendingPoolDeposit (uint256 amount);
  
  event LendingPoolWithdrawal (uint256 amount);

  constructor() ERC20("Benjamins", "BNJI") {    
    addressOfThisContract = address(this);
    feeReceiver = 0xa9ECE84E3139CBa81F60F648002D38c635cd857d;                      // <==== changed_ for testing XXXXX
    accumulatedReceiver = 0x7c976677499803bbc72262784ec45088715c0221;              // <==== changed_ for testing XXXXX
    updateWhitelisted(owner(), true);
    amountDecimals = 0;
    polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);              
    polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);             
    polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);         
    
    //mumbaiUSDC = IERC20(0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e);               // <==== changed_ for Mumbai testnet XXXXX
    //mumbaiAMUSDC = IERC20(0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9);             // <==== changed_ for Mumbai testnet XXXXX
    //mumbaiLendingPool = ILendingPool(0x9198F13B08E299d85E096929fA9781A1E3d5d827);  // <==== changed_ for Mumbai testnet XXXXX   

    levelAntes =     [ 0, 20, 60, 100, 500, 2000];
    levelHolds =     [ 0, 2,   7,  30,  90,  360];              // days needed to hold tokens
    levelDiscounts = [ 0, 5,  10,  20,  40,   75];              // in percent*100
    
    pause();
  }

  receive() external payable {   
  }  
  
  function decimals() public view override returns (uint8) {
    return amountDecimals;
  }
  
  function calcCurrentLevel(address userToCheck) public view returns (uint256) {   // XXXXXX <===== public only for testing
    uint256 userBalance = balanceOf(userToCheck);
    uint256 currentLevel;
    for (currentLevel = 0; levelAntes[currentLevel] < userBalance; currentLevel ++){
    }
    return currentLevel;
  }

  function calcDiscount(address userToCheck) public view returns (uint256) {   // XXXXXX <===== public only for testing
    if (isWhitelisted(userToCheck)){
      return 100;
    }

    return levelDiscounts[calcCurrentLevel(userToCheck)];
  }

  function isWhitelisted(address userToCheck) internal view returns (bool){
    return whitelisted[userToCheck];
  }

  function mintToSelf (uint256 amountOfBNJIs) public {
    specifiedAmountMint(amountOfBNJIs, msg.sender);
  }

  function mintToBeneficiary (uint256 amountOfBNJIs, address receiverOfTokens) public {
    specifiedAmountMint(amountOfBNJIs, receiverOfTokens);
  }

  function specifiedAmountMint(uint256 amount, address receiverOfTokens) internal whenNotPaused nonReentrant returns (uint256) {  

    require (amount % 1 == 0, 'BNJ: amount must be divisible by 1, BNJIs have 0 decimals.'); 
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(amount);
    
    uint256 usersFeeModifier = 100 - (calcDiscount(msg.sender)); 

    uint256 feeIn6dec = ((priceForMintingIn6dec * usersFeeModifier * baseFee) /100) /100;
    
    uint256 roundThisDown = feeIn6dec % (10000);
    
    uint256 feeRoundedDownIn6dec = feeIn6dec - roundThisDown;
    
    uint256 endPriceIn6dec = priceForMintingIn6dec + feeRoundedDownIn6dec;
    
    uint256 polygonUSDCbalanceIn6dec = polygonUSDC.balanceOf( msg.sender ) ;
    
    uint256 USDCAllowancein6dec = polygonUSDC.allowance(msg.sender, addressOfThisContract); 
    
    require (endPriceIn6dec <= polygonUSDCbalanceIn6dec, "BNJ, specifiedAmountMint: Not enough USDC"); 
    require (endPriceIn6dec <= USDCAllowancein6dec, "BNJ, specifiedAmountMint: Not enough allowance in USDC for payment" );
    require (priceForMintingIn6dec >= 5000000, "BNJ, specifiedAmountMint: Minimum minting value of $5 USDC" );
    
    polygonUSDC.transferFrom(msg.sender, feeReceiver, feeRoundedDownIn6dec);   

    polygonUSDC.transferFrom(msg.sender, addressOfThisContract, priceForMintingIn6dec);  

    approveLendingPool(priceForMintingIn6dec);

    uint256 LendingPoolAllowancein6dec = polygonUSDC.allowance(addressOfThisContract, address(polygonLendingPool)); 
    console.log(LendingPoolAllowancein6dec, 'BNJ, LendingPoolAllowancein6dec ');  // take out later XXXXX

    depositIntoLendingPool(priceForMintingIn6dec);      

    lastDepositBlockHeight[receiverOfTokens] = block.number;

    // minting to receiverOfTokens
    _mint(receiverOfTokens, amount);    

    emit SpecifiedMintEvent(msg.sender, receiverOfTokens, amount, priceForMintingIn6dec);    

    return priceForMintingIn6dec;   
  }  

  function calcSpecMintReturn(uint256 amount) public view returns (uint256 mintPrice) {
    require (amount % 1 == 0, 'BNJ: amount must be divisible by 1, BNJIs have 0 decimals.'); 
    return calcPriceForTokenMint(totalSupply(), amount); 
  }    

  function burnForSelf (uint256 amountOfBNJIs) public {
    specifiedAmountBurn(amountOfBNJIs, msg.sender);
  }

  function burnForBeneficiary (uint256 amountOfBNJIs, address receiverOfUSDC) public {
    specifiedAmountBurn(amountOfBNJIs, receiverOfUSDC);
  }

  function specifiedAmountBurn(uint256 amount, address receiverOfUSDC) internal whenNotPaused nonReentrant returns (uint256) { 

    require (amount % 1 == 0, 'BNJ: amount must be divisible by 1, BNJIs have 0 decimals.');

    require (checkWithdrawAllowed(msg.sender), "BNJ, specifiedAmountBurn: msg.sender is not yet allowed to withdraw/burn");

    uint256 tokenBalance = balanceOf(msg.sender);    
     
    require(amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= amount, "Users tokenBalance must be equal to or more than amount to burn.");             
    
    uint256 returnForBurningIn6dec = calcSpecBurnReturn(amount);
    
    require (returnForBurningIn6dec >= 5000000, "BNJ, specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 usersFeeModifier = 100 - (calcDiscount(msg.sender));

    uint256 feeIn6dec = ((returnForBurningIn6dec * usersFeeModifier * baseFee) /100) / 100;   
    
    uint256 roundThisDown = feeIn6dec % (10000);
    
    uint256 feeRoundedDownIn6dec = feeIn6dec - roundThisDown;
   
    uint256 endReturnIn6dec = returnForBurningIn6dec - feeRoundedDownIn6dec;            

    _burn(msg.sender, amount);      
    emit SpecifiedBurnEvent(msg.sender, receiverOfUSDC, amount, returnForBurningIn6dec);     

    withdrawFromLendingPool(returnForBurningIn6dec); 

    polygonUSDC.transfer(feeReceiver, feeRoundedDownIn6dec);
    polygonUSDC.transfer(receiverOfUSDC, endReturnIn6dec);  

    return returnForBurningIn6dec;   
  }

  function calcSpecBurnReturn(uint256 amount) public view returns (uint256 burnReturn) { 
    require (amount % 1 == 0, 'BNJ: amount must be divisible by 1, BNJIs have 0 decimals.'); 
    return calcReturnForTokenBurn(totalSupply(), amount); 
  }         

  function amountBlocksHoldingNeeded(address userToCheck) public view returns (uint256) {   // XXXXXX <===== public only for testing
    return (levelHolds[calcCurrentLevel(userToCheck)] * blocksPerDay);
  }

  function showBaseFee() public view returns (uint256) {  
    return baseFee;
  }


  function checkWithdrawAllowed (address userToCheck) internal view returns (bool) {
    uint256 holdTime = (block.number - lastDepositBlockHeight[userToCheck]);
    return ( (holdTime > antiFlashLoan) && ( holdTime > amountBlocksHoldingNeeded(userToCheck) ) );
  }

  function transfer(address receiver, uint256 amountOfBNJIs ) public override returns (bool) {
    if (checkWithdrawAllowed(msg.sender)) {     
      lastDepositBlockHeight[receiver] = block.number;
      _transfer(_msgSender(), receiver, amountOfBNJIs);      
      return true;
    }
  }

  function transferFrom(address payingAddress, address receiver, uint256 amountOfBNJIs) public override returns (bool) {
    if (checkWithdrawAllowed(payingAddress)) { 
      _transfer(payingAddress, receiver, amountOfBNJIs);
      address spender = _msgSender();
      uint256 currentAllowance =  allowance(payingAddress, spender);
      require(currentAllowance >= amountOfBNJIs, "ERC20: transfer amount exceeds allowance");
      _approve(payingAddress, spender, (currentAllowance - amountOfBNJIs));

      return true;
    }
  }

  function approveLendingPool (uint256 amountToApprove) private {   
    polygonUSDC.approve(address(polygonLendingPool), amountToApprove);               
  }

  function depositIntoLendingPool(uint256 amount) private {    
		polygonLendingPool.deposit(address(polygonUSDC), amount, addressOfThisContract, 0);    
    emit LendingPoolDeposit(amount);
	}

	function withdrawFromLendingPool(uint256 amount) private whenNotPaused {
		polygonLendingPool.withdraw(address(polygonUSDC), amount, addressOfThisContract);
    emit LendingPoolWithdrawal(amount);
	}
   
  function withdrawAccumulated(uint256 amount) public onlyOwner {
    polygonAMUSDC.transfer(accumulatedReceiver, amount);
  } 

  function depositUSDCBuffer (uint256 amount) public onlyOwner {
    polygonLendingPool.deposit(address(polygonUSDC), amount, addressOfThisContract, 0);    
    emit LendingPoolDeposit(amount);
  } 

  function calcAllTokensValue() public view onlyOwner returns (uint256 allTokensReturn) {
    return calcReturnForTokenBurn(totalSupply(), totalSupply()); 
  }

  function updateFeeReceiver(address newAddress) public onlyOwner {
    require(newAddress != address(0), "updateFeeReceiver: newAddress cannot be the zero address");
    feeReceiver = newAddress;
  }

  function updateAccumulatedReceiver(address newAddress) public onlyOwner {
    require(newAddress != address(0), "updateAccumulatedReceiver: newAddress cannot be the zero address");
    accumulatedReceiver = newAddress;
  }  

  function updatePolygonUSDC(address newAddress) public onlyOwner {
    require(newAddress != address(0), "updatePolygonUSDC: newAddress cannot be the zero address");
    polygonUSDC = IERC20(newAddress);
  }

  function updatePolygonAMUSDC(address newAddress) public onlyOwner {
    require(newAddress != address(0), "updatePolygonAMUSDC: newAddress cannot be the zero address");
    polygonAMUSDC = IERC20(newAddress);
  }

  function updatePolygonLendingPool(address newAddress) public onlyOwner {
    require(newAddress != address(0), "updatePolygonLendingPool: newAddress cannot be the zero address");
    polygonLendingPool = ILendingPool(newAddress);
  }

  function updateApproveLendingPool (uint256 amountToApprove) public onlyOwner {   
    polygonUSDC.approve(address(polygonLendingPool), amountToApprove);       
  }

  function updateLevelAntes (uint256[] memory newLevelAntes) public onlyOwner {
    levelAntes = newLevelAntes;
  }

  function updateLevelHolds (uint256[] memory newLevelHolds) public onlyOwner {
    levelHolds = newLevelHolds;
  }

  function updateLevelDiscounts (uint256[] memory newLevelDiscounts) public onlyOwner {
    levelDiscounts = newLevelDiscounts;
  }  

  function updateWhitelisted (address userToModifyWL, bool newStatus) public onlyOwner {
    whitelisted[userToModifyWL] = newStatus;
  }
}