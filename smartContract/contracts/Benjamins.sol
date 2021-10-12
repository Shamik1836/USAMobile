pragma solidity ^0.8.0;

import "./BNJICurve.sol";
import "./ILendingPool.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract Benjamins is ERC20, BNJICurve, ReentrancyGuard {
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

  uint8 private _decimals;
  uint256 largestUint = type(uint256).max;

  uint256 centsScale4digits = 10000;
  uint256 dollarScale6dec = 1000000;

  uint256 stakingPeriodInSeconds = 0; // 86400; <===== XXXXX, _changed only for testing

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

  constructor(address _feeReceiver) ERC20("Benjamins", "BNJI") {
    addressOfThisContract = address(this);
    feeReceiver = _feeReceiver;
    _decimals = 0;
    polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);
    polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);        
    _approveLendingPool(largestUint);    
  }

  function _approveLendingPool (uint256 _amountToApprove) public onlyOwner {
    //console.log('msg.sender in _approveLendingPool, BNJ:', msg.sender );
    polygonUSDC.approve(address(polygonLendingPool), _amountToApprove);
    //console.log('addressOfThisContract allowance to lendingpool _approveLendingPool, BNJ:', polygonUSDC.allowance(addressOfThisContract, address(polygonLendingPool)));
    //console.log('msg.sender allowance to lendingpool in _approveLendingPool, BNJ:', polygonUSDC.allowance(msg.sender, address(polygonLendingPool)));    
  }

  receive() external payable {   
  }

  function decimals() public view override returns (uint8) {
    return 0;
  }
  
  function findUsersLevelFeeModifier (address user) private view returns (uint256 _usersFee) {

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
      
      // staking period is hardcoded at the moment to 24 hours                           //  <======== XXXXX deactivated only for testing
      uint256 unlockTimeStamp = usersStakeArray[index].stakeCreatedTimestamp + stakingPeriodInSeconds;  //  <======== XXXXX deactivated only for testing 

      //uint256 unlockTimeStamp = 1;                                                      //  <======== XXXXX only for testing 
      
      // each time an active and burnable stake is found, nrOfActiveBurnableStakes is increased by 1
      if (usersStakeArray[index].unstaked == false && unlockTimeStamp <= timestampNow ) {
        nrOfActiveBurnableStakes++;
      }     

      //console.log("BNJ,checkStakedArrayOfUser: the checked users array at position:", index, "is:");
      //console.log("BNJ,checkStakedArrayOfUser: stakingAddress:", usersStakeArray[index].stakingAddress);
      //console.log("BNJ,checkStakedArrayOfUser: stakeID:", usersStakeArray[newIndex].stakeID;
      //console.log("BNJ,checkStakedArrayOfUser: tokenAmount:", usersStakeArray[index].tokenAmount);      
      //console.log("BNJ,checkStakedArrayOfUser: stakeCreatedTimestamp:", usersStakeArray[index].stakeCreatedTimestamp);
      //console.log("BNJ,checkStakedArrayOfUser: unstaked:", usersStakeArray[index].unstaked);
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
  function specifiedMint( uint256 _tokenAmountToMint) public whenNotPaused {        
    _specifiedAmountMint(_tokenAmountToMint);
  }
  */

  function buyLevels(uint256 amountOfLevels) public {
    _specifiedAmountMint(amountOfLevels * 20);
  }

  function _specifiedAmountMint(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {   
    //console.log('BNJ, _specifiedAmountMint: _amount', _amount);
    //require(_amount > 0, "BNJ, _specifiedAmountMint: Amount must be more than zero."); 
    require((_amount % 20 == 0), "BNJ, _specifiedAmountMint: Amount must be divisible by 20");       
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(_amount);
    //console.log(priceForMintingIn6dec, 'priceForMintingIn6dec in _specifiedAmountMint, BNJ');     

    uint256 usersFeeModifier = findUsersLevelFeeModifier( msg.sender ); 

    uint256 feeIn6dec = ((priceForMintingIn6dec * usersFeeModifier) /100) /100;
    console.log(feeIn6dec, 'feeIn6dec in _specifiedAmountMint, BNJ');   
    
    uint256 roundThisDown = feeIn6dec % (10**4);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountMint, BNJ');   

    uint256 feeRoundedDownIn6dec = feeIn6dec - roundThisDown;
    console.log(feeRoundedDownIn6dec, 'feeRoundedDownIn6dec in _specifiedAmountMint, BNJ');   

    uint256 endPriceIn6dec = priceForMintingIn6dec + feeRoundedDownIn6dec;
    console.log(endPriceIn6dec, 'endPriceIn6dec in _specifiedAmountMint, BNJ');       

    uint256 polygonUSDCbalanceIn6dec = polygonUSDC.balanceOf( msg.sender ) ;
    //console.log(polygonUSDCbalanceIn6dec, 'polygonUSDCbalanceIn6dec in _specifiedAmountMint, BNJ');

    //uint256 polygonUSDCbalInCents = polygonUSDCbalanceIn6dec / centsScale4digits;
    //console.log(polygonUSDCbalInCents, 'polygonUSDCbalInCents in _specifiedAmountMint, BNJ');

    uint256 _USDCAllowancein6dec = polygonUSDC.allowance(msg.sender, addressOfThisContract); 
    console.log(_USDCAllowancein6dec, '_USDCAllowancein6dec in _specifiedAmountMint, BNJ');

    //uint256 _USDCAllowanceinCents = _USDCAllowancein6dec / centsScale4digits;
    //console.log(_USDCAllowanceinCents, '_USDCAllowance in _specifiedAmountMint, BNJ' );
    
    require (endPriceIn6dec <= polygonUSDCbalanceIn6dec, "BNJ, _specifiedAmountMint: Not enough USDC"); 
    require (endPriceIn6dec <= _USDCAllowancein6dec, "BNJ, _specifiedAmountMint: Not enough allowance in USDC for payment" );
    require (priceForMintingIn6dec >= 5000000, "BNJ, _specifiedAmountMint: Minimum minting value of $5 USDC" );
    
    polygonUSDC.transferFrom(msg.sender, feeReceiver, feeRoundedDownIn6dec);   

    polygonUSDC.transferFrom(msg.sender, addressOfThisContract, priceForMintingIn6dec);  

    _depositIntoLendingPool(priceForMintingIn6dec);   
    
     
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, _amount);
    emit SpecifiedMintEvent(msg.sender, _amount, priceForMintingIn6dec);

    // this is the user's balance of tokens
    ownedBenjamins[msg.sender] += _amount;

    uint256 amountOfLevelsToBuy = _amount / 20;

    for (uint256 index = 0; index < amountOfLevelsToBuy; index++) {
      _stakeTokens(msg.sender, 20);
    }     

    return priceForMintingIn6dec;   
  }  

  function calcSpecMintReturn(uint256 _amount) public view whenNotPaused returns (uint256 mintPrice) {
    return calcPriceForTokenMint(totalSupply(), _amount); 
  }    

  /*
  function specifiedBurn( uint256 _tokenAmountToBurn) public payable whenNotPaused {    
    _specifiedAmountBurn(_tokenAmountToBurn);
  }
  */

  function sellLevels(uint256 amountOfLevels) public {
    _specifiedAmountBurn(amountOfLevels * 20);
  }

  function _specifiedAmountBurn(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {
    //console.log('BNJ, _specifiedAmountBurn: _amount', _amount);

    require((_amount % 20) == 0, "BNJ, _specifiedAmountMint: Amount must be divisible by 20");   

    uint256 tokenBalance = checkStakedBenjamins(msg.sender);
    //console.log(_amount, '_amount in _specifiedAmountBurn, BNJ');   
    //console.log(tokenBalance, 'tokenBalance in _specifiedAmountBurn, BNJ');   
     
    require(_amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= _amount, "Users tokenBalance must be equal to or more than amount to burn.");             
    
    uint256 returnForBurningIn6dec = calcSpecBurnReturn(_amount);
    //console.log(returnForBurning, 'returnForBurning in _specifiedAmountBurn, BNJ');   

    require (returnForBurningIn6dec >= 5000000, "BNJ, _specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 usersFeeModifier = findUsersLevelFeeModifier( msg.sender );

    uint256 feeIn6dec = ((returnForBurningIn6dec * usersFeeModifier) /100) / 100;   
    //console.log(fee, 'feeIn6dec in _specifiedAmountBurn, BNJ');   

    uint256 roundThisDown = feeIn6dec % (10**4);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountBurn, BNJ');   

    uint256 feeRoundedDown = feeIn6dec - roundThisDown;
    //console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountBurn, BNJ');   

    uint256 endReturnIn6dec = returnForBurningIn6dec - feeRoundedDown;
    //console.log(endReturn, 'endReturn in _specifiedAmountBurn, BNJ');   

    uint256 toPayoutTotal =  feeRoundedDown + endReturnIn6dec;  // XXXXXX
    //console.log(toPayoutTotal, 'toPayoutTotal in _specifiedAmountBurn, BNJ');    // XXXXXX

    uint256 checkTheBalance = polygonUSDC.balanceOf(addressOfThisContract);    // XXXXXX
    //console.log(checkTheBalance, 'checkTheBalance in _specifiedAmountBurn, BNJ');   // XXXXXX

    

    uint256 amountOfLevelsToSell = _amount / 20;

    for (uint256 index = 0; index < amountOfLevelsToSell; index++) {
      _unstakeTokens(msg.sender, 20);
    }   

    // this is the user's balance of tokens
    ownedBenjamins[msg.sender] -= _amount;

    _burn(addressOfThisContract, _amount);      
    emit SpecifiedBurnEvent(msg.sender, _amount, returnForBurningIn6dec);  
    


    _withdrawFromLendingPool(returnForBurningIn6dec); 

    polygonUSDC.transfer(feeReceiver, feeRoundedDown);
    polygonUSDC.transfer(msg.sender, endReturnIn6dec);     
    
    

    return returnForBurningIn6dec;   
  }

  function calcSpecBurnReturn(uint256 _amount) public view whenNotPaused returns (uint256 burnReturn) {    
    //console.log("BNJ, calcSpecBurnReturn, totalsupply:", totalSupply() );
    //console.log("BNJ, calcSpecBurnReturn, _amount:", _amount );
    return calcReturnForTokenBurn(totalSupply(), _amount); 
  }      

  function _stakeTokens(address _stakingUserAddress, uint256 _amountOfTokensToStake) private {
    uint256 tokensOwned = checkOwnedBenjamins( _stakingUserAddress ) ;
    //console.log(tokensOwned, 'tokensOwned in _stakeTokens, BNJ');

    require (_amountOfTokensToStake <= tokensOwned, 'BNJ, _stakeTokens: Not enough tokens'); 

    if (!isOnStakingList[_stakingUserAddress]) {
      stakers.push(_stakingUserAddress);
      isOnStakingList[_stakingUserAddress] = true;
    }

    uint256 _stakeID = usersStakingPositions[_stakingUserAddress].length;

    Stake memory newStake = Stake({ 
      stakingAddress: address(_stakingUserAddress),
      stakeID: uint256(_stakeID),
      tokenAmount: uint256(_amountOfTokensToStake),      
      stakeCreatedTimestamp: uint256(block.timestamp),
      unstaked: false       
    });        

    usersStakingPositions[_stakingUserAddress].push(newStake);

    totalStakedByUser[_stakingUserAddress] += _amountOfTokensToStake;
  }

  function _unstakeTokens(address _stakingUserAddress, uint256 _amountOfTokensToUnstake) private {

    uint256 tokensOwned = checkStakedBenjamins( _stakingUserAddress ) ;
    console.log(tokensOwned, 'tokensOwned in _unstakeTokens, BNJ');

    require (_amountOfTokensToUnstake <= tokensOwned, 'BNJ, _unstakeTokens: Not enough tokens'); 
   
    Stake[] memory usersActiveBurnableStakess = getUsersActiveAndBurnableStakes(_stakingUserAddress);

    require (usersActiveBurnableStakess.length > 0, 'BNJ, _unstakeTokens: No burnable staking positions found. Consider time since staking.');

    uint256 newestActiveStake = usersActiveBurnableStakess.length - 1;

    uint256 stakeIDtoUnstake = usersActiveBurnableStakess[newestActiveStake].stakeID;    

    for (uint256 unStIndex = 0; unStIndex < usersStakingPositions[_stakingUserAddress].length; unStIndex++) {
      if (usersStakingPositions[_stakingUserAddress][unStIndex].stakeID == stakeIDtoUnstake ) {
        usersStakingPositions[_stakingUserAddress][unStIndex].unstaked = true;
      }
    }    

    totalStakedByUser[_stakingUserAddress] -= _amountOfTokensToUnstake;
  }

  function checkOwnedBenjamins(address userToCheck) public view returns (uint256 usersOwnedBNJIs){
    return ownedBenjamins[userToCheck];
  }

  function showInternalAddresses() public view onlyOwner returns (address[] memory) {
    return internalAddresses;  
  }
  
  function checkStakedBenjamins(address userToCheck) public view returns (uint256 usersStakedBNJIs){
    uint256 usersTotalStake = totalStakedByUser[userToCheck];
    //console.log("BNJ,checkStakedBenjamins: the checked user is staking in total: ", usersTotalStake);
    return usersTotalStake;
  }   

  function _depositIntoLendingPool(uint256 amount) private whenNotPaused {
    //console.log("BNJI, _depositIntoLendingPool, msg.sender is:", msg.sender);
		polygonLendingPool.deposit(address(polygonUSDC), amount, addressOfThisContract, 0);    
    emit LendingPoolDeposit(amount);
	}

	function _withdrawFromLendingPool(uint256 amount) private whenNotPaused {
		polygonLendingPool.withdraw(address(polygonUSDC), amount, addressOfThisContract);
    emit LendingPoolWithdrawal(amount);
	}
 
  
  function internalMint(uint256 _amount, address _holderOfInternalMint) public onlyOwner returns (uint256) {
    //console.log('BNJ, internalMint: _amount', _amount);

    if (!isOnInternalList[_holderOfInternalMint]) {
      internalAddresses.push(_holderOfInternalMint);
      isOnInternalList[_holderOfInternalMint] = true;
    }
    
    require(_amount > 0, "BNJ, internalMint: Amount must be more than zero.");        
    require(_amount % 20 == 0, "BNJ, internalMint: Amount must be divisible by 20");   
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(_amount);
    //console.log(priceForMintingIn6dec, 'priceForMintingIn6dec in internalMint, BNJ');     

    uint256 polygonUSDCbalanceIn6dec = polygonUSDC.balanceOf( msg.sender ) ;
    //console.log(polygonUSDCbalanceIn6dec, 'polygonUSDCbalanceIn6dec in internalMint, BNJ');    

    uint256 _USDCAllowancein6dec = polygonUSDC.allowance(msg.sender, addressOfThisContract); 
    //console.log(_USDCAllowancein6dec, '_USDCAllowancein6dec in internalMint, BNJ');

    //uint256 _USDCAllowanceinCents = _USDCAllowancein6dec / centsScale4digits;
    //console.log(_USDCAllowanceinCents, '_USDCAllowance in internalMint, BNJ' );
    
    require (priceForMintingIn6dec <= polygonUSDCbalanceIn6dec, "BNJ, internalMint: Not enough USDC"); 
    require (priceForMintingIn6dec <= _USDCAllowancein6dec, "BNJ, internalMint: Not enough allowance in USDC for payment" );
    require (priceForMintingIn6dec >= 5000000, "BNJ, internalMint: Minimum minting value of $5 USDC" );      

    polygonUSDC.transferFrom(msg.sender, addressOfThisContract, priceForMintingIn6dec);
    _depositIntoLendingPool(priceForMintingIn6dec);    
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, _amount);
    emit SpecifiedMintEvent(msg.sender, _amount, priceForMintingIn6dec);

    // this is the user's balance of tokens
    internalBenjamins[_holderOfInternalMint] += _amount;    

    return priceForMintingIn6dec; 

  }

  function internalBurn(uint256 _amount) public whenNotPaused nonReentrant returns (uint256) {
    //console.log('BNJ, internalBurn: _amount', _amount);

    require(_amount % 20 == 0, "BNJ, internalBurn: Amount must be divisible by 20");   

    uint256 tokenBalance = internalBenjamins[msg.sender];    
    
    //console.log(_amount, '_amount in internalBurn, BNJ');   
    //console.log(tokenBalance, 'tokenBalance in internalBurn, BNJ');   
     
    require(_amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= _amount, "Users tokenBalance must be equal to or more than amount to burn.");             
    
    uint256 returnForBurningIn6dec = calcSpecBurnReturn(_amount);
    //console.log(returnForBurning, 'returnForBurning in internalBurn, BNJ');   

    require (returnForBurningIn6dec >= 5000000, "BNJ, internalBurn: Minimum burning value is $5 USDC" );    

    // this is the user's balance of tokens
    internalBenjamins[msg.sender] -= _amount;

    _burn(addressOfThisContract, _amount);      
    emit SpecifiedBurnEvent(msg.sender, _amount, returnForBurningIn6dec);  

    _withdrawFromLendingPool(returnForBurningIn6dec); 
   
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

      //console.log("BNJ,checkStakedArrayOfUser: the checked users array at position:", index, "is:");
      //console.log("BNJ,checkStakedArrayOfUser: stakingAddress:", usersStakeArray[index].stakingAddress);
      //console.log("BNJ,checkStakedArrayOfUser: stakeID:", usersStakeArray[index].stakeID);      
      //console.log("BNJ,checkStakedArrayOfUser: tokenAmount:", usersStakeArray[index].tokenAmount);      
      //console.log("BNJ,checkStakedArrayOfUser: stakeCreatedTimestamp:", usersStakeArray[index].stakeCreatedTimestamp);
      //console.log("BNJ,checkStakedArrayOfUser: unstaked:", usersStakeArray[index].unstaked);
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

  function calcAccumulated() public view onlyOwner returns (uint256 accumulated) {
    uint256 allTokensValue = calcAllTokensValue();
    uint256 allTokensValueBuffered = (allTokensValue * 97) / 100;

    uint256 allAMUSDC = polygonAMUSDC.balanceOf(addressOfThisContract);

    uint256 _accumulated = allTokensValueBuffered - allAMUSDC;
    return _accumulated;

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

  function updateStakingPeriodInSeconds (uint256 _new_stakingPeriodInSeconds) public onlyOwner {
    stakingPeriodInSeconds = _new_stakingPeriodInSeconds;
  }  

  function updateFeeReceiver(address _newAddress) public onlyOwner {
    require(_newAddress != address(0), "updateFeeReceiver: _newAddress cannot be the zero address");
    feeReceiver = _newAddress;
  }

  function updateAccumulatedReceiver(address _newAddress) public onlyOwner {
    require(_newAddress != address(0), "updateAccumulatedReceiver: _newAddress cannot be the zero address");
    accumulatedReceiver = _newAddress;
  }  

  function updatePolygonUSDC(address _newAddress) public onlyOwner {
    require(_newAddress != address(0), "updatePolygonUSDC: _newAddress cannot be the zero address");
    polygonUSDC = IERC20(_newAddress);
  }

  function updatePolygonAMUSDCC(address _newAddress) public onlyOwner {
    require(_newAddress != address(0), "updatePolygonAMUSDCC: _newAddress cannot be the zero address");
    polygonAMUSDC = IERC20(_newAddress);
  }

  function updatePolygonLendingPool(address _newAddress) public onlyOwner {
    require(_newAddress != address(0), "updatePolygonLendingPool: _newAddress cannot be the zero address");
    polygonLendingPool = ILendingPool(_newAddress);
  }
    
  function updateTier_0_feeMod (uint256 _new_tier_0_feeMod) public onlyOwner {
    tier_0_feeMod = _new_tier_0_feeMod;
  }

  function updateTier_1_feeMod (uint256 _new_tier_1_feeMod) public onlyOwner {
    tier_1_feeMod = _new_tier_1_feeMod;
  }

  function updateTier_2_feeMod (uint256 _new_tier_2_feeMod) public onlyOwner {
    tier_2_feeMod = _new_tier_2_feeMod;
  }

  function updateTier_3_feeMod (uint256 _new_tier_3_feeMod) public onlyOwner {
    tier_3_feeMod = _new_tier_3_feeMod;
  }

  function updateTier_4_feeMod (uint256 _new_tier_4_feeMod) public onlyOwner {
    tier_4_feeMod = _new_tier_4_feeMod;
  }  

}
