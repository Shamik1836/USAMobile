pragma solidity ^0.8.0;

import "./OurCurve.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract OurToken is ERC20, OurCurve, ReentrancyGuard {
  using SafeMath for uint256;

  mapping (address => uint256) ownedBenjamins;

  address[] private stakers;
  mapping (address => bool) public isOnStakingList;
  mapping (address => Stake[]) public usersStakingPositions;
  mapping (address => uint256) public totalStakedByUser;

  struct Stake {
    address stakingAddress;
    uint256 amount;
    uint256 stakeCreatedTimestamp; 
    bool deleted;
  }


  IERC20 public mockUSDCToken;
  address addressOfThisContract;

  address feeReceiver;

  uint8 private _decimals;

  constructor(address _mockUSDCTokenAddress, address _feeReceiver) ERC20("OurToken", "OTK") {
    _decimals = 0;
    mockUSDCToken = IERC20(_mockUSDCTokenAddress);
    addressOfThisContract = address(this);
    feeReceiver = _feeReceiver;
  }

  /* XXXXX
    function handleApproval(uint256 _amountToReturn, address _user) internal returns (bool approvedSuccess) {
      mockUSDCToken.approve(_user, (_amountToReturn + 1000000000000000000));    
      uint256 allowanceToGetReturn = mockUSDCToken.allowance(addressOfThisContract, _user);
      //console.log(allowanceToGetReturn, 'allowanceToGetReturn in _specifiedAmountBurn, OTK');    
      return true;
  }*/      

  

  

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
    //console.log('OTK, _specifiedAmountMint: _amount', _amount);
    require(_amount > 0, "Amount must be more than zero.");       
    
    uint256 priceForMinting = calcSpecMintReturn(_amount);
    //console.log(priceForMinting, 'priceForMinting in _specifiedAmountMint, OTK');   

    uint256 fee = priceForMinting / 100;
    //console.log(fee, 'fee in _specifiedAmountMint, OTK');   

    uint256 roundThisDown = fee % (10**16);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountMint, OTK');   

    uint256 feeRoundedDown = fee - roundThisDown;
    //console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountMint, OTK');   

    uint256 endPrice = priceForMinting + feeRoundedDown;
    console.log(endPrice, 'endPrice in _specifiedAmountMint, OTK');       

    uint256 mockUSDCBalance = mockUSDCToken.balanceOf( _msgSender() ) ;
    //console.log(mockUSDCBalance, 'mockUSDCBalance in _specifiedAmountMint, OTK');
    uint256 mockUSDCAllowance = mockUSDCToken.allowance(_msgSender(), addressOfThisContract); 
    console.log(mockUSDCAllowance, 'mockUSDCAllowance in _specifiedAmountMint, OTK' );

    require (endPrice <= mockUSDCBalance, "OTK, _specifiedAmountMint: Not enough mockUSDC"); 
    require (endPrice <= mockUSDCAllowance, "OTK, _specifiedAmountMint: Not enough allowance in mockUSDC for payment" );
    require (priceForMinting >= 5000000000000000000, "OTK, _specifiedAmountMint: Minimum minting value of $5 USDC" );

    
    mockUSDCToken.transferFrom(_msgSender(), feeReceiver, feeRoundedDown);   

    mockUSDCToken.transferFrom(_msgSender(), addressOfThisContract, priceForMinting);   // <=== make this Aave
  
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
    console.log(tokensOwned, 'tokensOwned in _stakeTokens, OTK');

    require (_amountOfTokensToStake <= tokensOwned, 'OTK, _stakeTokens: Not enough tokens'); 

    if (!isOnStakingList[_stakingUserAddress]) {
      stakers.push(_stakingUserAddress);
      isOnStakingList[_stakingUserAddress] = true;
    }

    Stake memory newStake = Stake({ 
      stakingAddress: address(_stakingUserAddress),
      amount: uint256(_amountOfTokensToStake),
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
    console.log("OTK,checkStakedBenjamins: the checked user is staking in total: ", usersTotalStake);
    return usersTotalStake;
  }

  function checkStakedArrayOfUser(address userToCheck) public view returns (Stake[] memory stakeArray){
    Stake[] memory usersStakeArray = usersStakingPositions[userToCheck];

    for (uint256 index = 0; index < usersStakeArray.length; index++) {      
      console.log("OTK,checkStakedArrayOfUser: the checked users array at position: ", index, "is:");
      console.log("OTK,checkStakedArrayOfUser: stakingAddress: ", usersStakeArray[index].stakingAddress);
      console.log("OTK,checkStakedArrayOfUser: amount: ", usersStakeArray[index].amount);
      console.log("OTK,checkStakedArrayOfUser: stakeCreatedTimestamp:", usersStakeArray[index].stakeCreatedTimestamp);
      console.log("OTK,checkStakedArrayOfUser: deleted:", usersStakeArray[index].deleted);
    }
    
    return usersStakeArray;
  }

  /*
  function callDepositStake( uint256 _amountOfTokensToStake) public {
    

    // args: address owner, address spender
    //uint256 allowance = allowance(_msgSender(), addressOfThisContract); 
    //console.log(allowance, 'allowance in callDepositStake, OTK');

    
    console.log(_amountOfTokensToStake, '_amountOfTokensToStake in callDepositStake, OTK'); 
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
    //console.log('OTK, _specifiedAmountBurn: _amount', _amount);

    uint256 tokenBalance = balanceOf(_msgSender());
    //console.log(_amount, '_amount in _specifiedAmountBurn, OTK');   
    //console.log(tokenBalance, 'tokenBalance in _specifiedAmountBurn, OTK');   
     
    require(_amount > 0, "Amount to burn must be more than zero.");  
    require(tokenBalance >= _amount, "Users tokenBalance must be equal to or more than amount to burn.");  
           
    
    uint256 returnForBurning = calcSpecBurnReturn(_amount);
    //console.log(returnForBurning, 'returnForBurning in _specifiedAmountBurn, OTK');   

    require (returnForBurning >= 5000000000000000000, "OTK, _specifiedAmountBurn: Minimum burning value is $5 USDC" );

    uint256 fee = returnForBurning / 100;
    //console.log(fee, 'fee in _specifiedAmountBurn, OTK');   

    uint256 roundThisDown = fee % (10**16);
    //console.log(roundThisDown, 'roundThisDown in _specifiedAmountBurn, OTK');   

    uint256 feeRoundedDown = fee - roundThisDown;
    //console.log(feeRoundedDown, 'feeRoundedDown in _specifiedAmountBurn, OTK');   

    uint256 endReturn = returnForBurning - feeRoundedDown;
    //console.log(endReturn, 'endReturn in _specifiedAmountBurn, OTK');   

    uint256 toPayoutTotal =  feeRoundedDown + endReturn;  // XXXXXX
    //console.log(toPayoutTotal, 'toPayoutTotal in _specifiedAmountBurn, OTK');    // XXXXXX

    uint256 checkTheBalance = mockUSDCToken.balanceOf(addressOfThisContract);    // XXXXXX
    //console.log(checkTheBalance, 'checkTheBalance in _specifiedAmountBurn, OTK');   // XXXXXX

    _burn(_msgSender(), _amount);        
    
    mockUSDCToken.transfer(feeReceiver, feeRoundedDown);
    mockUSDCToken.transfer(_msgSender(), endReturn);     
    
    emit SpecifiedBurnEvent(_msgSender(), _amount, returnForBurning);

    return returnForBurning;   
  }

  function calcSpecBurnReturn(uint256 _amount) public view whenNotPaused returns (uint256 burnReturn) {
    
    //console.log("OTK, calcSpecBurnReturn, totalsupply:", totalSupply() );
    //console.log("OTK, calcSpecBurnReturn, _amount:", _amount );
    return calcReturnForTokenBurn(totalSupply(), _amount); 
  }      
  
}
