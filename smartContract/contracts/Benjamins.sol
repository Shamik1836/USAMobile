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


  ILendingPool public polygonLendingPool;
  IERC20 public polygonUSDC;
  

  constructor(address _feeReceiver) ERC20("Benjamins", "BNJI") {
    addressOfThisContract = address(this);
    feeReceiver = _feeReceiver;
    _decimals = 0;
    polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);        
    _approveLendingPool(largestUint);
  }

  function _approveLendingPool (uint256 _amountToApprove) public onlyOwner {
    polygonUSDC.approve(address(polygonLendingPool), _amountToApprove);
  }

  receive() external payable {   
  }

  function decimals() public view override returns (uint8) {
    return 0;
  }

  event SpecifiedMintEvent (address sender, uint256 tokenAmount, uint256 priceForMinting);  

  function specifiedMint( uint256 _tokenAmountToMint) public whenNotPaused {    
    _specifiedAmountMint(_tokenAmountToMint);
  }

  function _specifiedAmountMint(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {
    //console.log('BNJ, _specifiedAmountMint: _amount', _amount);
    require(_amount > 0, "Amount must be more than zero.");       
    
    uint256 priceForMinting = calcSpecMintReturn(_amount);
    //console.log(priceForMinting, 'priceForMinting in _specifiedAmountMint, BNJ');     

    uint256 fee = priceForMinting / 100;
    //console.log(fee, 'fee in _specifiedAmountMint, BNJ');   

    uint256 roundThisDown = fee % (10**16);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountMint, BNJ');   

    uint256 feeRoundedDown = fee - roundThisDown;
    //console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountMint, BNJ');   

    uint256 endPrice = priceForMinting + feeRoundedDown;
    console.log(endPrice, 'endPrice in _specifiedAmountMint, BNJ');       

    uint256 _USDCBalance = polygonUSDC.balanceOf( _msgSender() ) ;
    //console.log(_USDCBalance, '_USDCBalance in _specifiedAmountMint, BNJ');
    uint256 _USDCAllowance = polygonUSDC.allowance(_msgSender(), addressOfThisContract); 
    console.log(_USDCAllowance, '_USDCAllowance in _specifiedAmountMint, BNJ' );

    require (endPrice <= _USDCBalance, "BNJ, _specifiedAmountMint: Not enough USDC"); 
    require (endPrice <= _USDCAllowance, "BNJ, _specifiedAmountMint: Not enough allowance in USDC for payment" );
    require (priceForMinting >= 5000000000000000000, "BNJ, _specifiedAmountMint: Minimum minting value of $5 USDC" );

    
    polygonUSDC.transferFrom(_msgSender(), feeReceiver, feeRoundedDown);   

    polygonUSDC.transferFrom(_msgSender(), addressOfThisContract, priceForMinting);   // <=== make this Aave
  
    // minting to Benjamins contract itself
    _mint(addressOfThisContract, _amount);
    emit SpecifiedMintEvent(addressOfThisContract, _amount, priceForMinting);

    // this is the user's balance of tokens
    ownedBenjamins[_msgSender()] += _amount;

    _stakeTokens(_msgSender(), _amount);

    return priceForMinting;   
  }

  function _stakeTokens(address _stakingUserAddress, uint256 _amountOfTokensToStake) private {
    uint256 tokensOwned = checkOwnedBenjamins( _stakingUserAddress ) ;
    console.log(tokensOwned, 'tokensOwned in _stakeTokens, BNJ');

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

  function checkOwnedBenjamins(address userToCheck) public view returns (uint256 usersOwnedBNJMNs){
    return ownedBenjamins[userToCheck];
  }

  function checkStakedBenjamins(address userToCheck) public view returns (uint256 usersStakedBNJMNs){
    uint256 usersTotalStake = totalStakedByUser[userToCheck];
    console.log("BNJ,checkStakedBenjamins: the checked user is staking in total: ", usersTotalStake);
    return usersTotalStake;
  }

  function checkStakedArrayOfUser(address userToCheck) public view returns (Stake[] memory stakeArray){
    Stake[] memory usersStakeArray = usersStakingPositions[userToCheck];

    for (uint256 index = 0; index < usersStakeArray.length; index++) {      
      console.log("BNJ,checkStakedArrayOfUser: the checked users array at position:", index, "is:");
      console.log("BNJ,checkStakedArrayOfUser: stakingAddress:", usersStakeArray[index].stakingAddress);
      console.log("BNJ,checkStakedArrayOfUser: tokenAmount:", usersStakeArray[index].tokenAmount);      
      console.log("BNJ,checkStakedArrayOfUser: stakeCreatedTimestamp:", usersStakeArray[index].stakeCreatedTimestamp);
      console.log("BNJ,checkStakedArrayOfUser: deleted:", usersStakeArray[index].deleted);
    }
    
    return usersStakeArray;
  }

  /*
  function callDepositStake( uint256 _amountOfTokensToStake) public {
    

    // args: address owner, address spender
    //uint256 allowance = allowance(_msgSender(), addressOfThisContract); 
    //console.log(allowance, 'allowance in callDepositStake, BNJ');

    
    console.log(_amountOfTokensToStake, '_amountOfTokensToStake in callDepositStake, BNJ'); 
    // args: address sender,address recipient,uint256 amount
    transfer(address(ourStakingContractInterface), _amountOfTokensToStake ); 

    //*bool sentSuccess =
    //console.log()

    //ourStakingContractInterface.depositStake();
  }/*
  /*
    function callWithdrawStake() public onlyOwner {
      ourStakingContractInterface.withdrawStake();
    }
  */
  function calcSpecMintReturn(uint256 _amount) public view whenNotPaused returns (uint256 mintPrice) {
    return calcPriceForTokenMint(totalSupply(), _amount); 
  }  
 
 
  event SpecifiedBurnEvent (address sender, uint256 tokenAmount, uint256 returnForBurning);  

  function specifiedBurn( uint256 _tokenAmountToBurn) public payable whenNotPaused {    
    _specifiedAmountBurn(_tokenAmountToBurn);
  }

  function _specifiedAmountBurn(uint256 _amount) internal whenNotPaused nonReentrant returns (uint256) {
    //console.log('BNJ, _specifiedAmountBurn: _amount', _amount);

    uint256 tokenBalance = balanceOf(_msgSender());
    //console.log(_amount, '_amount in _specifiedAmountBurn, BNJ');   
    //console.log(tokenBalance, 'tokenBalance in _specifiedAmountBurn, BNJ');   
     
    require(_amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= _amount, "Users tokenBalance must be equal to or more than amount to burn.");  
           
    
    uint256 returnForBurning = calcSpecBurnReturn(_amount);
    //console.log(returnForBurning, 'returnForBurning in _specifiedAmountBurn, BNJ');   

    require (returnForBurning >= 5000000000000000000, "BNJ, _specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 fee = returnForBurning / 100;
    //console.log(fee, 'fee in _specifiedAmountBurn, BNJ');   

    uint256 roundThisDown = fee % (10**16);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountBurn, BNJ');   

    uint256 feeRoundedDown = fee - roundThisDown;
    //console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountBurn, BNJ');   

    uint256 endReturn = returnForBurning - feeRoundedDown;
    //console.log(endReturn, 'endReturn in _specifiedAmountBurn, BNJ');   

    uint256 toPayoutTotal =  feeRoundedDown + endReturn;  // XXXXXX
    //console.log(toPayoutTotal, 'toPayoutTotal in _specifiedAmountBurn, BNJ');    // XXXXXX

    uint256 checkTheBalance = polygonUSDC.balanceOf(addressOfThisContract);    // XXXXXX
    //console.log(checkTheBalance, 'checkTheBalance in _specifiedAmountBurn, BNJ');   // XXXXXX

    _burn(_msgSender(), _amount);        
    
    polygonUSDC.transfer(feeReceiver, feeRoundedDown);
    polygonUSDC.transfer(_msgSender(), endReturn);     
    
    emit SpecifiedBurnEvent(_msgSender(), _amount, returnForBurning);

    return returnForBurning;   
  }

  function calcSpecBurnReturn(uint256 _amount) public view whenNotPaused returns (uint256 burnReturn) {
    
    //console.log("BNJ, calcSpecBurnReturn, totalsupply:", totalSupply() );
    //console.log("BNJ, calcSpecBurnReturn, _amount:", _amount );
    return calcReturnForTokenBurn(totalSupply(), _amount); 
  }      
  
}
