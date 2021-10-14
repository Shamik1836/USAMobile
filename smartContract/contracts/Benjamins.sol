//SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "./BNJICurve.sol";
import "./ILendingPool.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Benjamins is ERC20, BNJICurve, ReentrancyGuard {   // <==== changed_ for Mumbai testnet
  using SafeMath for uint256;
 
  address public addressOfThisContract;

  address private feeReceiver; 
  address private accumulatedReceiver;   

  address[] private stakers;
  address[] private internalAddresses;

  mapping (address => uint256) private ownedBenjamins;
  mapping (address => uint256) private internalBenjamins;
  mapping (address => uint256) private totalStakedByUser;
  mapping (address => bool) private isOnStakingList;
  mapping (address => bool) private isOnInternalList;
  mapping (address => Stake[]) private usersStakingPositions;
  mapping (address => Stake[]) private internalStakingPositions;  

  struct Stake {
    address stakingAddress;
    uint256 stakeID;
    uint256 tokenAmount;    
    uint256 stakeCreatedTimestamp; 
    bool unstaked;
  }

  uint8 private amountDecimals;
  
  uint256 stakingPeriodInSeconds = 0; // 86400; <===== XXXXX, changed_ only for testing

  uint256 tier_0_feeMod = 100;
  uint256 tier_1_feeMod = 95;
  uint256 tier_2_feeMod = 85;
  uint256 tier_3_feeMod = 70;
  uint256 tier_4_feeMod = 50;
  uint256 tier_5_feeMod = 25;   

  ILendingPool public polygonLendingPool;
  IERC20 public polygonUSDC;
  IERC20 public polygonAMUSDC;

  event SpecifiedMintEvent (address sender, uint256 tokenAmount, uint256 priceForMintingIn6dec);  

  event SpecifiedBurnEvent (address sender, uint256 tokenAmount, uint256 returnForBurning);  

  event LendingPoolDeposit (uint256 amount);
  
  event LendingPoolWithdrawal (uint256 amount);

  constructor() ERC20("Benjamins", "BNJI") {     // <==== changed_ for Mumbai testnet
    addressOfThisContract = address(this);
    feeReceiver = owner();
    accumulatedReceiver = owner();
    amountDecimals = 0;
    polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);              
    polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);             
    polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);         
    
    //mumbaiUSDC = IERC20(0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e);               // <==== changed_ for Mumbai testnet
    //mumbaiAMUSDC = IERC20(0x2271e3Fef9e15046d09E1d78a8FF038c691E9Cf9);             // <==== changed_ for Mumbai testnet
    //mumbaiLendingPool = ILendingPool(0x9198F13B08E299d85E096929fA9781A1E3d5d827);  // <==== changed_ for Mumbai testnet   
    
    pause();
  }

  receive() external payable {   
  }

  function approveLendingPool (uint256 amountToApprove) private {   
    polygonUSDC.approve(address(polygonLendingPool), amountToApprove);           
  }
  
  function decimals() public view override returns (uint8) {
    return amountDecimals;
  }
  
  function findUsersLevelFeeModifier (address user) private view returns (uint256 usersFeeModifier) {

    uint256 usersStakedBalance = checkStakedBenjamins(user);
    
    if (usersStakedBalance < 20) {
      return tier_0_feeMod;
    }
    else if (usersStakedBalance >= 20 && usersStakedBalance < 40 ) {
      return tier_1_feeMod;
    }    
    else if (usersStakedBalance >= 40 && usersStakedBalance < 60) {
      return tier_2_feeMod;
    }
    else if (usersStakedBalance >= 60 && usersStakedBalance < 80) {
      return tier_3_feeMod;
    }  
    else if (usersStakedBalance >= 80 && usersStakedBalance < 100) {
      return tier_4_feeMod;
    } 
    else if (usersStakedBalance >= 100 ) {
      return tier_5_feeMod;
    } 
    
  }

  function getUsersActiveAndBurnableStakes (address userToCheck) public view returns (Stake[] memory stakeArray){    

    uint256 timestampNow = uint256(block.timestamp);

    uint256 nrOfActiveBurnableStakes;

    Stake[] memory usersStakeArray = usersStakingPositions[userToCheck];

    for (uint256 index = 0; index < usersStakeArray.length; index++) {       
                           
      uint256 unlockTimeStamp = usersStakeArray[index].stakeCreatedTimestamp + stakingPeriodInSeconds;  
      
      // each time an active and burnable stake is found, nrOfActiveBurnableStakes is increased by 1
      if (usersStakeArray[index].unstaked == false && unlockTimeStamp <= timestampNow ) {
        nrOfActiveBurnableStakes++;
      }    

    }

    if (nrOfActiveBurnableStakes == 0){
      return new Stake[](0);
    }

    else {
      // 'activeBurnableStakes' array with hardcoded length, defined by active stakes found above
      Stake[] memory activeBurnableStakes = new Stake[](nrOfActiveBurnableStakes);      

      // index position in activeBurnableStakes array
      uint256 newIndex = 0 ;

      for (uint256 k = 0; k < activeBurnableStakes.length; k++) {
        
        // each time an active stake is found, its details are put into the next position in the 'activeBurnableStakes' array
        if (usersStakeArray[k].unstaked == false) {
          activeBurnableStakes[newIndex].stakingAddress = usersStakeArray[newIndex].stakingAddress;
          activeBurnableStakes[newIndex].stakeID = usersStakeArray[newIndex].stakeID;
          activeBurnableStakes[newIndex].tokenAmount = usersStakeArray[newIndex].tokenAmount;
          activeBurnableStakes[newIndex].stakeCreatedTimestamp = usersStakeArray[newIndex].stakeCreatedTimestamp;
          activeBurnableStakes[newIndex].unstaked = usersStakeArray[newIndex].unstaked;
          newIndex++;
        }         

      }
      // returning activeBurnableStakes array
      return activeBurnableStakes; 

    } 
    
  } 

  

  /*
  function specifiedMint( uint256 tokenAmountToMint) public whenNotPaused {        
    specifiedAmountMint(tokenAmountToMint);
  }
  */

  function buyLevels(uint256 amountOfLevels) public whenNotPaused {
    specifiedAmountMint(amountOfLevels * 20);
  }

  function specifiedAmountMint(uint256 amount) internal whenNotPaused nonReentrant returns (uint256) {   
    
    require((amount % 20 == 0), "BNJ, specifiedAmountMint: Amount must be divisible by 20");       
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(amount);
    
    uint256 usersFeeModifier = findUsersLevelFeeModifier( msg.sender ); 

    uint256 feeIn6dec = ((priceForMintingIn6dec * usersFeeModifier) /100) /100;
    
    uint256 roundThisDown = feeIn6dec % (10**4);
    
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

    depositIntoLendingPool(priceForMintingIn6dec);      
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, amount);
    emit SpecifiedMintEvent(msg.sender, amount, priceForMintingIn6dec);

    // this is the user's balance of tokens
    ownedBenjamins[msg.sender] += amount;

    uint256 amountOfLevelsToBuy = amount / 20;

    for (uint256 index = 0; index < amountOfLevelsToBuy; index++) {
      stakeTokens(msg.sender, 20);
    }     

    return priceForMintingIn6dec;   
  }  

  function calcSpecMintReturn(uint256 amount) public view returns (uint256 mintPrice) {
    return calcPriceForTokenMint(totalSupply(), amount); 
  }    

  /*
  function specifiedBurn( uint256 tokenAmountToBurn) public payable whenNotPaused {    
    specifiedAmountBurn(tokenAmountToBurn);
  }
  */

  function sellLevels(uint256 amountOfLevels) public whenNotPaused {
    specifiedAmountBurn(amountOfLevels * 20);
  }

  function specifiedAmountBurn(uint256 amount) internal whenNotPaused nonReentrant returns (uint256) {    

    require((amount % 20) == 0, "BNJ, specifiedAmountMint: Amount must be divisible by 20");   

    uint256 tokenBalance = checkStakedBenjamins(msg.sender);    
     
    require(amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= amount, "Users tokenBalance must be equal to or more than amount to burn.");             
    
    uint256 returnForBurningIn6dec = calcSpecBurnReturn(amount);
    
    require (returnForBurningIn6dec >= 5000000, "BNJ, specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 usersFeeModifier = findUsersLevelFeeModifier( msg.sender );

    uint256 feeIn6dec = ((returnForBurningIn6dec * usersFeeModifier) /100) / 100;   
    
    uint256 roundThisDown = feeIn6dec % (10**4);
    
    uint256 feeRoundedDown = feeIn6dec - roundThisDown;
   
    uint256 endReturnIn6dec = returnForBurningIn6dec - feeRoundedDown;      

    uint256 amountOfLevelsToSell = amount / 20;

    for (uint256 index = 0; index < amountOfLevelsToSell; index++) {
      unstakeTokens(msg.sender, 20);
    }   

    // this is the user's balance of tokens
    ownedBenjamins[msg.sender] -= amount;

    _burn(addressOfThisContract, amount);      
    emit SpecifiedBurnEvent(msg.sender, amount, returnForBurningIn6dec);      


    withdrawFromLendingPool(returnForBurningIn6dec); 

    polygonUSDC.transfer(feeReceiver, feeRoundedDown);
    polygonUSDC.transfer(msg.sender, endReturnIn6dec);     
    
    

    return returnForBurningIn6dec;   
  }

  function calcSpecBurnReturn(uint256 amount) public view returns (uint256 burnReturn) {    
    //console.log("BNJ, calcSpecBurnReturn, totalsupply:", totalSupply() );
    //console.log("BNJ, calcSpecBurnReturn, amount:", amount );
    return calcReturnForTokenBurn(totalSupply(), amount); 
  }      

  function stakeTokens(address stakingUserAddress, uint256 amountOfTokensToStake) private {
    uint256 tokensOwned = checkOwnedBenjamins( stakingUserAddress ) ;    

    require (amountOfTokensToStake <= tokensOwned, 'BNJ, stakeTokens: Not enough tokens'); 

    if (!isOnStakingList[stakingUserAddress]) {
      stakers.push(stakingUserAddress);
      isOnStakingList[stakingUserAddress] = true;
    }

    uint256 stakeID = usersStakingPositions[stakingUserAddress].length;

    Stake memory newStake = Stake({ 
      stakingAddress: address(stakingUserAddress),
      stakeID: uint256(stakeID),
      tokenAmount: uint256(amountOfTokensToStake),      
      stakeCreatedTimestamp: uint256(block.timestamp),
      unstaked: false       
    });        

    usersStakingPositions[stakingUserAddress].push(newStake);

    totalStakedByUser[stakingUserAddress] += amountOfTokensToStake;
  }

  function unstakeTokens(address stakingUserAddress, uint256 amountOfTokensToUnstake) private {

    uint256 tokensStaked = checkStakedBenjamins( stakingUserAddress ) ;    

    require (amountOfTokensToUnstake <= tokensStaked, 'BNJ, unstakeTokens: Not enough tokens'); 
   
    Stake[] memory usersActiveBurnableStakess = getUsersActiveAndBurnableStakes(stakingUserAddress);

    require (usersActiveBurnableStakess.length > 0, 'BNJ, unstakeTokens: No burnable staking positions found. Consider time since staking.');

    uint256 newestActiveStake = usersActiveBurnableStakess.length - 1;

    uint256 stakeIDtoUnstake = usersActiveBurnableStakess[newestActiveStake].stakeID;    

    for (uint256 unStIndex = 0; unStIndex < usersStakingPositions[stakingUserAddress].length; unStIndex++) {
      if (usersStakingPositions[stakingUserAddress][unStIndex].stakeID == stakeIDtoUnstake ) {
        usersStakingPositions[stakingUserAddress][unStIndex].unstaked = true;
      }
    }    

    totalStakedByUser[stakingUserAddress] -= amountOfTokensToUnstake;
  }

  function checkOwnedBenjamins(address userToCheck) private view returns (uint256 usersOwnedBNJIs){
    return ownedBenjamins[userToCheck];
  }

  function showInternalAddresses() public view onlyOwner returns (address[] memory) {
    return internalAddresses;  
  }

 function showStakersAddresses() public view onlyOwner returns (address[] memory) {
    return stakers;  
  }
  
  
  function checkStakedBenjamins(address userToCheck) public view returns (uint256 usersStakedBNJIs){   // XXXXX <=======changed_ this only for testing, should be private visibility
    uint256 usersTotalStake = totalStakedByUser[userToCheck];
   
    return usersTotalStake;
  }   

  function depositIntoLendingPool(uint256 amount) private {    
		polygonLendingPool.deposit(address(polygonUSDC), amount, addressOfThisContract, 0);    
    emit LendingPoolDeposit(amount);
	}

	function withdrawFromLendingPool(uint256 amount) private whenNotPaused {
		polygonLendingPool.withdraw(address(polygonUSDC), amount, addressOfThisContract);
    emit LendingPoolWithdrawal(amount);
	}
 
  
  function internalMint(uint256 amount, address holderOfInternalMint) public onlyOwner returns (uint256) {
   
    if (!isOnInternalList[holderOfInternalMint]) {
      internalAddresses.push(holderOfInternalMint);
      isOnInternalList[holderOfInternalMint] = true;
    }
    
    require(amount > 0, "BNJ, internalMint: Amount must be more than zero.");        
    require(amount % 20 == 0, "BNJ, internalMint: Amount must be divisible by 20");   
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(amount);    

    uint256 polygonUSDCbalanceIn6dec = polygonUSDC.balanceOf( msg.sender ) ;   

    uint256 USDCAllowancein6dec = polygonUSDC.allowance(msg.sender, addressOfThisContract);     
    
    require (priceForMintingIn6dec <= polygonUSDCbalanceIn6dec, "BNJ, internalMint: Not enough USDC"); 
    require (priceForMintingIn6dec <= USDCAllowancein6dec, "BNJ, internalMint: Not enough allowance in USDC for payment" );
    require (priceForMintingIn6dec >= 5000000, "BNJ, internalMint: Minimum minting value of $5 USDC" );      

    polygonUSDC.transferFrom(msg.sender, addressOfThisContract, priceForMintingIn6dec);

    approveLendingPool(priceForMintingIn6dec);

    depositIntoLendingPool(priceForMintingIn6dec);    
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, amount);
    emit SpecifiedMintEvent(msg.sender, amount, priceForMintingIn6dec);

    // this is the user's balance of tokens
    internalBenjamins[holderOfInternalMint] += amount;    

    return priceForMintingIn6dec; 
  }

  function internalBurn(uint256 amount) public whenNotPaused nonReentrant returns (uint256) {   

    require(amount % 20 == 0, "BNJ, internalBurn: Amount must be divisible by 20");   

    uint256 tokenBalance = internalBenjamins[msg.sender];  
     
    require(amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= amount, "Users tokenBalance must be equal to or more than amount to burn.");             
    
    uint256 returnForBurningIn6dec = calcSpecBurnReturn(amount);    

    require (returnForBurningIn6dec >= 5000000, "BNJ, internalBurn: Minimum burning value is $5 USDC" );    

    // this is the user's balance of tokens
    internalBenjamins[msg.sender] -= amount;

    _burn(addressOfThisContract, amount);      
    emit SpecifiedBurnEvent(msg.sender, amount, returnForBurningIn6dec);  

    withdrawFromLendingPool(returnForBurningIn6dec); 
   
    polygonUSDC.transfer(msg.sender, returnForBurningIn6dec);  

    return returnForBurningIn6dec;   
  }

  function showAllUsersStakes(address userToCheck) public view onlyOwner returns (Stake[] memory stakeArray) { 
    return usersStakingPositions[userToCheck];
  }

  function showInternalBenjamins (address userToCheck) public view onlyOwner returns (uint256) {   
    return internalBenjamins[userToCheck];
  }

  function getInternalActiveStakes(address userToCheck) public view onlyOwner returns (Stake[] memory stakeArray){

    uint256 nrOfActiveStakes;

    Stake[] memory usersStakeArray = internalStakingPositions[userToCheck];

    for (uint256 index = 0; index < usersStakeArray.length; index++) { 

      // each time an active stake is found, nrOfActiveStakes is increased by 1
      if (usersStakeArray[index].unstaked == false) {
        nrOfActiveStakes++;
      }     
    }

    if (nrOfActiveStakes == 0){
      return new Stake[](0);
    }

    else {
      // 'activeStakes' array with hardcoded length, defined by active stakes found above
      Stake[] memory activeStakes = new Stake[](nrOfActiveStakes);      

      // index position in activeStakes array
      uint256 newIndex = 0 ;

      for (uint256 k = 0; k < activeStakes.length; k++) {
        
        // each time an active stake is found, its details are put into the next position in the 'activeStakes' array
        if (usersStakeArray[k].unstaked == false) {
          activeStakes[newIndex].stakingAddress = usersStakeArray[newIndex].stakingAddress;
          activeStakes[newIndex].stakeID = usersStakeArray[newIndex].stakeID;          
          activeStakes[newIndex].tokenAmount = usersStakeArray[newIndex].tokenAmount;
          activeStakes[newIndex].stakeCreatedTimestamp = usersStakeArray[newIndex].stakeCreatedTimestamp;
          activeStakes[newIndex].unstaked = usersStakeArray[newIndex].unstaked;
          newIndex++;
        }         

      }
      // returning activeStakes array
      return activeStakes; 

    } 
    
  } 

  function calcAccumulated() public view onlyOwner returns (uint256 accumulatedAmount) {
    uint256 allTokensValue = calcAllTokensValue();
    uint256 allTokensValueBuffered = (allTokensValue * 97) / 100;

    uint256 allAMUSDC = polygonAMUSDC.balanceOf(addressOfThisContract);

    uint256 accumulated = allTokensValueBuffered - allAMUSDC;
    return accumulated;

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

  function updateStakingPeriodInSeconds (uint256 newstakingPeriodInSeconds) public onlyOwner {
    stakingPeriodInSeconds = newstakingPeriodInSeconds;
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

  function updateTier0feeMod (uint256 newtier0feeMod) public onlyOwner {
    tier_0_feeMod = newtier0feeMod;
  }

  function updateTier1feeMod (uint256 newtier1feeMod) public onlyOwner {
    tier_1_feeMod = newtier1feeMod;
  }

  function updateTier2feeMod (uint256 newtier2feeMod) public onlyOwner {
    tier_2_feeMod = newtier2feeMod;
  }

  function updateTier3feeMod (uint256 newtier3feeMod) public onlyOwner {
    tier_3_feeMod = newtier3feeMod;
  }

  function updateTier4feeMod (uint256 newtier4feeMod) public onlyOwner {
    tier_4_feeMod = newtier4feeMod;
  } 

  function updateTier5feeMod (uint256 newtier4feeMod) public onlyOwner {
    tier_5_feeMod = newtier4feeMod;
  }   

}
