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

  mapping (address => uint256) ownedBenjamins;

  mapping (address => bool) private isOnStakingList;
  mapping (address => Stake[]) private usersStakingPositions;
  mapping (address => uint256) private totalStakedByUser;

  struct Stake {
    address stakingAddress;
    uint256 tokenAmount;    
    uint256 stakeCreatedTimestamp; 
    bool deleted;
  }

  uint8 private _decimals;
  uint256 largestUint = type(uint256).max;

  uint256 centsScale4digits = 10000;
  uint256 dollarScale6dec = 1000000;

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

  
  function specifiedMint( uint256 _tokenAmountToMint) public whenNotPaused {    
    //console.log(' = = = = = == = === = = = = = =  =msg.sender in specifiedAmountMint, BNJ:', msg.sender );
    _specifiedAmountMint(_tokenAmountToMint);
  }

  function _specifiedAmountMint(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {
    //console.log(' = = = = = == = === = = = = = =  = msg.sender in _specifiedAmountMint, BNJ:', msg.sender );
    ////console.log('BNJ, _specifiedAmountMint: _amount', _amount);
    require(_amount > 0, "Amount must be more than zero.");       
    
    uint256 priceForMintingIn6dec = calcSpecMintReturn(_amount);
    ////console.log(priceForMintingIn6dec, 'priceForMintingIn6dec in _specifiedAmountMint, BNJ');     

    uint256 feeIn6dec = priceForMintingIn6dec / 100;
    //console.log(feeIn6dec, 'feeIn6dec in _specifiedAmountMint, BNJ');   

    uint256 roundThisDown = feeIn6dec % (10**4);
    ////console.log(roundThisDown, 'roundThisDown in _specifiedAmountMint, BNJ');   

    uint256 feeRoundedDownIn6dec = feeIn6dec - roundThisDown;
    ////console.log(feeRoundedDownIn6dec, 'feeRoundedDownIn6dec in _specifiedAmountMint, BNJ');   

    uint256 endPriceIn6dec = priceForMintingIn6dec + feeRoundedDownIn6dec;
    //console.log(endPriceIn6dec, 'endPriceIn6dec in _specifiedAmountMint, BNJ');       

    uint256 polygonUSDCbalanceIn6dec = polygonUSDC.balanceOf( _msgSender() ) ;
    ////console.log(polygonUSDCbalanceIn6dec, 'polygonUSDCbalanceIn6dec in _specifiedAmountMint, BNJ');

    //uint256 polygonUSDCbalInCents = polygonUSDCbalanceIn6dec / centsScale4digits;
    ////console.log(polygonUSDCbalInCents, 'polygonUSDCbalInCents in _specifiedAmountMint, BNJ');

    uint256 _USDCAllowancein6dec = polygonUSDC.allowance(_msgSender(), addressOfThisContract); 
    //console.log(_USDCAllowancein6dec, '_USDCAllowancein6dec in _specifiedAmountMint, BNJ');

    //uint256 _USDCAllowanceinCents = _USDCAllowancein6dec / centsScale4digits;
    ////console.log(_USDCAllowanceinCents, '_USDCAllowance in _specifiedAmountMint, BNJ' );
    
    require (endPriceIn6dec <= polygonUSDCbalanceIn6dec, "BNJ, _specifiedAmountMint: Not enough USDC"); 
    require (endPriceIn6dec <= _USDCAllowancein6dec, "BNJ, _specifiedAmountMint: Not enough allowance in USDC for payment" );
    require (priceForMintingIn6dec >= 5000000, "BNJ, _specifiedAmountMint: Minimum minting value of $5 USDC" );
    
    polygonUSDC.transferFrom(_msgSender(), feeReceiver, feeRoundedDownIn6dec);   

    polygonUSDC.transferFrom(_msgSender(), addressOfThisContract, priceForMintingIn6dec);  

    _depositIntoLendingPool(priceForMintingIn6dec);    
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, _amount);
    emit SpecifiedMintEvent(addressOfThisContract, _amount, priceForMintingIn6dec);

    // this is the user's balance of tokens
    ownedBenjamins[_msgSender()] += _amount;

    _stakeTokens(_msgSender(), _amount);

    return priceForMintingIn6dec;   
  }  

  function calcSpecMintReturn(uint256 _amount) public view whenNotPaused returns (uint256 mintPrice) {
    return calcPriceForTokenMint(totalSupply(), _amount); 
  }    

  function specifiedBurn( uint256 _tokenAmountToBurn) public payable whenNotPaused {    
    _specifiedAmountBurn(_tokenAmountToBurn);
  }

  function _specifiedAmountBurn(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {
    ////console.log('BNJ, _specifiedAmountBurn: _amount', _amount);

    uint256 tokenBalance = balanceOf(_msgSender());
    ////console.log(_amount, '_amount in _specifiedAmountBurn, BNJ');   
    ////console.log(tokenBalance, 'tokenBalance in _specifiedAmountBurn, BNJ');   
     
    require(_amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= _amount, "Users tokenBalance must be equal to or more than amount to burn.");  
           
    
    uint256 returnForBurning = calcSpecBurnReturn(_amount);
    ////console.log(returnForBurning, 'returnForBurning in _specifiedAmountBurn, BNJ');   

    require (returnForBurning >= 5000000000000000000, "BNJ, _specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 fee = returnForBurning / 100;
    ////console.log(fee, 'fee in _specifiedAmountBurn, BNJ');   

    uint256 roundThisDown = fee % (10**4);
    ////console.log(roundThisDown, 'roundThisDown in _specifiedAmountBurn, BNJ');   

    uint256 feeRoundedDown = fee - roundThisDown;
    ////console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountBurn, BNJ');   

    uint256 endReturn = returnForBurning - feeRoundedDown;
    ////console.log(endReturn, 'endReturn in _specifiedAmountBurn, BNJ');   

    uint256 toPayoutTotal =  feeRoundedDown + endReturn;  // XXXXXX
    ////console.log(toPayoutTotal, 'toPayoutTotal in _specifiedAmountBurn, BNJ');    // XXXXXX

    uint256 checkTheBalance = polygonUSDC.balanceOf(addressOfThisContract);    // XXXXXX
    ////console.log(checkTheBalance, 'checkTheBalance in _specifiedAmountBurn, BNJ');   // XXXXXX

    _burn(_msgSender(), _amount);        
    
    polygonUSDC.transfer(feeReceiver, feeRoundedDown);
    polygonUSDC.transfer(_msgSender(), endReturn);     
    
    emit SpecifiedBurnEvent(_msgSender(), _amount, returnForBurning);

    return returnForBurning;   
  }

  function calcSpecBurnReturn(uint256 _amount) public view whenNotPaused returns (uint256 burnReturn) {
    
    ////console.log("BNJ, calcSpecBurnReturn, totalsupply:", totalSupply() );
    ////console.log("BNJ, calcSpecBurnReturn, _amount:", _amount );
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

    Stake memory newStake = Stake({ 
      stakingAddress: address(_stakingUserAddress),
      tokenAmount: uint256(_amountOfTokensToStake),      
      stakeCreatedTimestamp: uint256(block.timestamp),
      deleted: false       
    });        

    usersStakingPositions[_stakingUserAddress].push(newStake);

    totalStakedByUser[_stakingUserAddress] += _amountOfTokensToStake;
  }

  function checkOwnedBenjamins(address userToCheck) public view returns (uint256 usersOwnedBNJIs){
    return ownedBenjamins[userToCheck];
  }

  function checkStakedBenjamins(address userToCheck) public view returns (uint256 usersStakedBNJIs){
    uint256 usersTotalStake = totalStakedByUser[userToCheck];
    //console.log("BNJ,checkStakedBenjamins: the checked user is staking in total: ", usersTotalStake);
    return usersTotalStake;
  }

  function checkStakedArrayOfUser(address userToCheck) public view returns (Stake[] memory stakeArray){
    Stake[] memory usersStakeArray = usersStakingPositions[userToCheck];

    for (uint256 index = 0; index < usersStakeArray.length; index++) {      
      //console.log("BNJ,checkStakedArrayOfUser: the checked users array at position:", index, "is:");
      //console.log("BNJ,checkStakedArrayOfUser: stakingAddress:", usersStakeArray[index].stakingAddress);
      //console.log("BNJ,checkStakedArrayOfUser: tokenAmount:", usersStakeArray[index].tokenAmount);      
      //console.log("BNJ,checkStakedArrayOfUser: stakeCreatedTimestamp:", usersStakeArray[index].stakeCreatedTimestamp);
      //console.log("BNJ,checkStakedArrayOfUser: deleted:", usersStakeArray[index].deleted);
    }
    
    return usersStakeArray;
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

  function calcAllTokensValue() public view onlyOwner returns (uint256 allTokensReturn) {
    return calcReturnForTokenBurn(totalSupply(), totalSupply()); 
  }
  
}
