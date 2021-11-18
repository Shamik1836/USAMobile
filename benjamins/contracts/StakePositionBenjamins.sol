// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

// importing interface for Aave's lending pool
import "./ILendingPool.sol";
// importing openZeppelin's SafeMath library
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
// importing openZeppelin's ERC20 contract
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// importing openZeppelin's Pausable contract
import "@openzeppelin/contracts/security/Pausable.sol";
// importing openZeppelin's Ownable contract
import "@openzeppelin/contracts/access/Ownable.sol";
// importing openZeppelin's ReentrancyGuard contract
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// importing openzeppelin interface for ERC20 tokens
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

// BNJI Utility Token.
// Price is set via bonding curve vs. USDC.
// All USDC is deposited in a singular lending pool (nominaly at AAVE).
// 100% USDC is maintained against burning. (see variable reserveInUSDCin6dec, in 6 decimals format)
// Collected fees and interest are withdrawable to the owner to a set recipient address.
// Fee discounts are calculated based on BNJI balance.
// Reentrancy is protected against via OpenZeppelin's ReentrancyGuard
// Discounts and level holds are staged vs. a lookup table.
contract StakePositionBenjamins is Ownable, ERC20, Pausable, ReentrancyGuard {
    
  ILendingPool public polygonLendingPool;     // Aave lending pool on Polygon
  IERC20 public polygonUSDC;                  // USDC crypto currency on Polygon
  IERC20 public polygonAMUSDC;                // Aave's amUSDC crypto currency on Polygon

  address public feeReceiver;                 // beneficiary address for collected fees

  uint256 public reserveInUSDCin6dec;         // end user USDC on deposit
  uint256 USDCscaleFactor = 1000000;          // 6 decimals scale of USDC crypto currency
  uint256 USDCcentsScaleFactor = 10000;       // 4 decimals scale of USDC crypto currency cents
  uint256 public blocksPerDay = 2;            // amount of blocks minted per day on polygon mainnet // TODO: change to 43200, value now is for testing
  uint8   private _decimals;                  // storing BNJI decimals, set to 0 in constructor
     
  uint256 public curveFactor = 8000000;       // Inverse slope of the bonding curve.
  uint16  public baseFeeTimes10k = 10000;     // percent * 10,000 as an integer (for ex. 1% baseFee expressed as 10000)

  // Manage Discounts
  uint32[] public levelAntes;                 // how many BNJI are needed for each level;
  uint16[] public levelHolds;                 // how many blocks to hold are necessary before withdraw is unlocked, at each level;
  uint8[]  public levelDiscounts;             // percentage discount given by each level;

  

  struct lockBox {
    uint256 lockBoxID;
    uint256 createdTimestamp;
    uint256 amountOfBNJIlocked;    
    address ownerOfLockbox;
    string testMessage; // TODO: take out, only for testing
  }

  // mapping: user to array of user's lockBoxes
  mapping (address => lockBox[] ) lockedInMapping;
  mapping (address => uint8) amountOfLockboxesForUser;
  uint256 lockBoxIDcounter;  // TODO: probably improve, use OZ counter mechanism


  function calcUsersLockedAmount(address _userToCheck) public view returns (uint256 totalAmountOfLockedBNJIblocksForUser) {
    // this is now, expressed in blockheight
    uint256 blockHeightNow = block.number;
    // this is the counter for amount of BNJI locked in the lockbox that's beeing looked at, 
    // multiplied by the amount of blocks this lockbox existed so far.
    uint256 blocksTimesBNJIlocked = 0; 
    // going through all existing lockboxes for this user
    // TODO: indexes of lockBoxes must get set and updated correctly upon creating and deleting (change boxID)
    // TODO: this is 0 index based, works with amountOfLockboxesForUser, if user has 3 lockboxes, the key values for them 
    // inlockedInMapping[_userToCheck] should be 1,2,3. This way they can be found though they are in a mapping, not an array
    for (uint8 index = 0; index < amountOfLockboxesForUser[_userToCheck]; index++) {
      uint256 foundBNJIinBox = lockedInMapping[_userToCheck][index].amountOfBNJIlocked;
      uint256 blocksLocked = blockHeightNow - lockedInMapping[_userToCheck][index].createdTimestamp;

      blocksTimesBNJIlocked += foundBNJIinBox*blocksLocked;
    }
    return blocksTimesBNJIlocked;
  }

  // todo: take out testingmessage
  function createLockBox (uint256 _amountOfBNJItoLock, string memory testingMessage) public hasTheBenjamins(_amountOfBNJItoLock) {
    // checking if allowance for BNJI is enough, owner is msg.sender, spender is this contract
    uint256 currentBNJIAllowance = allowance(msg.sender, address(this));
    require(currentBNJIAllowance >= _amountOfBNJItoLock, "Benjamins: transfer amount exceeds allowance");
    // transferring BNJI from msg.sender to this contract
    _transfer (msg.sender, address(this), _amountOfBNJItoLock);
    // decreasing BNJI allowance by transferred amount
    _approve(msg.sender, address(this), currentBNJIAllowance - _amountOfBNJItoLock); 

    // this is now, expressed in blockheight
    uint256 blockHeightNow = block.number;

    // increasing global lockBoxIDcounter
    lockBoxIDcounter +=1;

    // updated lockBoxIDcounter is saved as lockBoxID into lockBox
    uint256 newLockBoxID = lockBoxIDcounter;  

    // creating new lockBox
    lockBox memory newLockBox = lockBox ({  
      lockBoxID:          uint256(newLockBoxID),        // unique identifier
      createdTimestamp:   uint256(blockHeightNow),      // timestamp of creation
      amountOfBNJIlocked: uint256(_amountOfBNJItoLock), // amount of BNJI that were locked in
      ownerOfLockbox:     address(msg.sender),          // msg.sender is owner of lockBox
      testMessage:        string(testingMessage)        // just for testing, to see if keeping track works as intended
    });   
    
    // saving new lockBox to users array, in the global lockedInMapping 
    lockedInMapping[msg.sender].push(newLockBox);     

    // increasing their counter of lockBoxes
    amountOfLockboxesForUser[msg.sender] += 1;
   
    emit LockBoxCreated (newLockBoxID, msg.sender, _amountOfBNJItoLock, blockHeightNow, testingMessage);
  }



  // This mapping keeps track of the blockheight, each time a user engages their discount lock    
  mapping (address => uint256) discountLockBlockHeight;

  // This mapping keeps track of the users accounts' locking. 
  // Locking activates withdraw and burning timeout periods and grants discounts
  mapping (address => bool) discountLockEngaged;    

  constructor() ERC20("Benjamins", "BNJI") {
    // Manage Benjamins
    _decimals = 0;                          // Benjamins have 0 decimals, only full tokens exist.
    reserveInUSDCin6dec = 0;                // upon contract creation, the reserve in USDC is 0

    // setting addresses for feeReceiver, USDC-, amUSDC- and Aave lending pool contracts
    feeReceiver = 0xE51c8401fe1E70f78BBD3AC660692597D33dbaFF;
    polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
    polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);
    polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

    // Manage discounts
    levelAntes =        [600, 1200, 1800];  // in Benjamins
    levelHolds =     [0,  30,   90,  180];  // in days
    levelDiscounts = [0,  10,   25,   50];  // in percent

    // calling OpenZeppelin's (pausable) pause function for initial preparations after deployment
    pause();
  }
    
  // event for engaging and disengaging the account's discount locking features
  event LockStatus(address account, bool acccountIsLocked);   

  event LockBoxCreated(uint256 lockBoxID, address owner, uint256 lockedBNJI, uint256 createdTimestamp, string testingMessage);

  // event for exchanging USDC and BNJI // TODO:include mint or burn bool or type string 
  event Exchanged(
    address fromAddress,
    address toAddress,
    uint256 inTokens,
    uint256 beforeFeeUSDCin6dec,
    uint256 feeUSDCin6dec
  );

  // event for withdrawGains function
  // availableIn6dec shows how many USDC were available to withdraw, in 6 decimals format
  // amountUSDCin6dec shows how many USDC were withdrawn, in 6 decimals format
  event ProfitTaken(uint256 availableIn6dec, uint256 amountUSDCin6dec);

  // event for deposits into the lending pool
  event LendingPoolDeposit (uint256 amountUSDCin6dec, address payer);

  // event for withdrawals from the lending pool
  event LendingPoolWithdrawal (uint256 amountUSDCBeforeFeein6dec, address payee);

  // event for updating these addresses: feeReceiver, polygonUSDC, polygonAMUSDC
  event AddressUpdate(address newAddress, string typeOfUpdate); 

  // event for updating the amounts of blocks mined on Polygon network per day
  event BlocksPerDayUpdate(uint256 newAmountOfBlocksPerDay);

  // event for updating the contract's approval to Aave's USDC lending pool
  event LendingPoolApprovalUpdate(uint256 amountToApproveIn6dec);

  // event for updating the table of necessary BNJI amounts for the respective account level
  event LevelAntesUpdate(uint32[] newLevelAntes);

  // event for updating the table of necessary holding periods for the respective account level
  event LevelHoldsUpdate(uint16[] newLevelHolds);

  // event for updating the table of discounts for the respective account level
  event LevelDiscountsUpdate(uint8[] newLevelDiscounts);

  // owner overrides paused.
  modifier whenAvailable() {        
    require(!paused() || (msg.sender == owner()), "Benjamins is paused.");
    _;
  }

  // checking that account has sufficient funds
  modifier hasTheBenjamins(uint256 want2Spend) {
    require(balanceOf(msg.sender) >= want2Spend, "Insufficient Benjamins.");
    _;
  }

  // TODO: check for circular logic: should lock get disengaged before burning (at least if user would lower their discount level)?
  // If the user has activated their discounts lock,
  // has their withdraw timeout already run out?
  modifier withdrawAllowed(address userToCheck) {
    if (discountLockEngaged[userToCheck] == true) {
      uint256 blocksStillNecessary = getWaitingTime(userToCheck);
      require(blocksStillNecessary <= 0, 'Discount level withdraw timeout in effect.');
    }
    _;
  }

  // Redundant reserveInUSDCin6dec protection vs. user withdraws. TODO: clean up
  modifier wontBreakTheBank(uint256 amountBNJItoBurn) {        
    // calculating the USDC value of the BNJI tokens to burn, and rounding them to full cents
    uint256 beforeFeesNotRoundedIn6dec = quoteUSDC(amountBNJItoBurn, false);        
    uint256 beforeFeesRoundedDownIn6dec = beforeFeesNotRoundedIn6dec - (beforeFeesNotRoundedIn6dec % USDCcentsScaleFactor);
    // if the USDC reserve counter shows less than what is needed, check the existing amUSDC balance of the contract
    if(reserveInUSDCin6dec < beforeFeesRoundedDownIn6dec) {
      uint256 fundsOnTab = polygonAMUSDC.balanceOf(address(this));
      // if there are enough amUSDC available, set the tracker to allow the transfer 
      if (fundsOnTab >= beforeFeesRoundedDownIn6dec ) {
        reserveInUSDCin6dec = beforeFeesRoundedDownIn6dec;                
      }
    }
    // if there are not enough amUSDC, throw an error 
    require(reserveInUSDCin6dec >= beforeFeesRoundedDownIn6dec, "BNJ: wontBreakTheBank threw");
    _;
  }

  // pausing funcionality from OpenZeppelin's Pausable
  function pause() public onlyOwner {
    _pause();
  }

  // unpausing funcionality from OpenZeppelin's Pausable
  function unpause() public onlyOwner {
    _unpause();
  }

  // Overriding OpenZeppelin's ERC20 function
  function decimals() public view override returns (uint8) {
    return _decimals;
  }

  function engageDiscountLock() public whenAvailable {
    require(discountLockEngaged[msg.sender] == false, 'Discount lock already engaged for user.');
    require(getDiscountLevel(msg.sender) >= 1, 'Account level must be at least 1, to get discounts.');
    discountLockEngaged[msg.sender] = true;       
    discountLockBlockHeight[msg.sender] = block.number;   
    emit LockStatus(msg.sender, true);
  }

  function disengageDiscountLock() public whenAvailable withdrawAllowed(msg.sender) {
    require(discountLockEngaged[msg.sender] == true, 'Discount lock already disengaged for user.');
    discountLockEngaged[msg.sender] = false;
    discountLockBlockHeight[msg.sender] = 0;   
    emit LockStatus(msg.sender, false);
  }

  // Modified ERC20 transfer()     
  // Cannot send until holding time has passed for sender, if sender has discountLock engaged    
  function transfer(address recipient, uint256 amount)
    public
    override
    nonReentrant
    whenAvailable
    withdrawAllowed(_msgSender())
  returns(bool) {  
    // transferring BNJI
    _transfer(_msgSender(), recipient, amount);
    
    return true;
  }

  // modified ERC20 transferFrom() 
  // Cannot send until holding time is passed for sender.
  // Creates possible lockout time for receiver.
  // USDC approval must be given as in transfer function, see above
  function transferFrom(address sender, address recipient, uint256 amountBNJI)
    public
    override
    nonReentrant
    whenAvailable
    withdrawAllowed(sender)
  returns (bool) {    
    // checking if allowance for BNJI is enough
    uint256 currentBNJIAllowance = allowance(sender, _msgSender());
    require(currentBNJIAllowance >= amountBNJI, "Benjamins: transfer amount exceeds allowance");
    // transferring BNJI
    _transfer (sender, recipient, amountBNJI);

    // decreasing BNJI allowance by transferred amount
    _approve(sender, _msgSender(), currentBNJIAllowance - amountBNJI);   
   
    return true;
  }

  // Buy BNJI with USDC.
  function mint(uint256 _amount) public {
    mintTo(_amount, msg.sender);
  }

  // Buy BNJI with USDC for another address.
  function mintTo(uint256 _amount, address _toWhom) public whenAvailable {   
    // minting to user
    changeSupply(_toWhom, _amount, true);
  }

  // Sell BNJI for USDC.
  function burn(uint256 _amount) public {
    burnTo(_amount, msg.sender);
  }

  // Sell your BNJI and send USDC to another address.
  function burnTo(uint256 _amount, address _toWhom)
    public
    whenAvailable
    hasTheBenjamins(_amount)
    wontBreakTheBank(_amount)
    withdrawAllowed(msg.sender)
  {
    changeSupply(_toWhom, _amount, false);
  }

  // Quote USDC for mint or burn
  // based on BNJI in circulation and amount to mint/burn
  function quoteUSDC(uint256 _amount, bool isMint) public view whenAvailable returns (uint256) {

    uint256 supply = totalSupply();                     // total supply of BNJI
    uint256 supply2 = supply*supply;                    // Supply squared
    uint256 supplyAfterTx;                              // post-mint supply, see below
    uint256 supplyAfterTx2;                             // post-mint supply squared, see below
    uint256 squareDiff;                                 // difference in supply, before and after, see below

    // this calculation is for minting BNJI
    if (isMint==true){                                  
      supplyAfterTx = supply + _amount;               
      supplyAfterTx2 = supplyAfterTx*supplyAfterTx;   
      squareDiff = supplyAfterTx2 - supply2;
    } 
        
    // this calculation is for burning BNJI
    else {                                              
      supplyAfterTx = supply - _amount;               
      supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
      squareDiff = supply2 - supplyAfterTx2;
    }

    // bringing difference into 6 decimals format for USDC
    uint256 scaledSquareDiff = squareDiff * USDCscaleFactor;       

    // finishing bonding curve calculation 
    uint256 amountInUSDCin6dec = scaledSquareDiff / curveFactor;    

    // rounding down to USDC cents
    uint256 endAmountUSDCin6dec = amountInUSDCin6dec - (amountInUSDCin6dec % USDCcentsScaleFactor); 

    // the amount of BNJI to be moved must be at least currently valued at $5 of USDC
    require (endAmountUSDCin6dec >= 5000000, "BNJ, quoteUSDC: Minimum BNJI value to move is $5 USDC" );

    // returning USDC value of BNJI before fees
    return endAmountUSDCin6dec;                         
  }

  // Returns theoretical account discount level as an uint8
  // Discounts are only applied if user has engaged their discount lock mechanism
  function getDiscountLevel(address _userToCheck) public view whenAvailable returns(uint8) {
    uint256 userBalance = balanceOf(_userToCheck); 
    uint8 currentLevel = 0;
    for (uint8 index = 0; index < levelAntes.length ; index++){
      if (userBalance >= levelAntes[index]) {
        currentLevel++;
      }
    }
    return currentLevel;       
  }
    
  // Execute mint or burn
  function changeSupply(address _forWhom, uint256 _amountBNJI, bool isMint) internal nonReentrant whenAvailable {
    uint256 beforeFeeInUSDCin6dec;
    // Calculate change in tokens and value of difference
    if (isMint == true) {
      beforeFeeInUSDCin6dec = quoteUSDC(_amountBNJI, true);
    } else {
      beforeFeeInUSDCin6dec = quoteUSDC(_amountBNJI, false);
    }
    uint256 feeNotRoundedIn6dec = (beforeFeeInUSDCin6dec * baseFeeTimes10k)/ USDCscaleFactor;
    uint256 feeRoundedDownIn6dec = feeNotRoundedIn6dec - (feeNotRoundedIn6dec % USDCcentsScaleFactor);
    // Execute exchange
    if (isMint == true) {
      // moving funds for minting
      moveUSDC(msg.sender, _forWhom, beforeFeeInUSDCin6dec, feeRoundedDownIn6dec, true);
      // minting
      _mint(_forWhom, _amountBNJI);
      // update reserve
      reserveInUSDCin6dec += beforeFeeInUSDCin6dec;
    } else {
      // burning
      _burn(msg.sender, _amountBNJI);
      // moving funds for burning
      moveUSDC(msg.sender, _forWhom, beforeFeeInUSDCin6dec, feeRoundedDownIn6dec, false);
      // update reserve            
      reserveInUSDCin6dec -= beforeFeeInUSDCin6dec;
    }

    emit Exchanged(msg.sender, _forWhom, _amountBNJI, beforeFeeInUSDCin6dec, feeRoundedDownIn6dec);
  }

  // Move USDC for a supply change.  Note: sign of amount is the mint/burn direction.
  function moveUSDC(
    address _payer,
    address _payee,
    uint256 _beforeFeeInUSDCin6dec,
    uint256 _feeRoundedDownIn6dec,
    bool isMint // negative when burning, does not include fee. positive when minting, includes fee.
  ) internal whenAvailable {
    if (isMint == true) {
      // on minting, fee is added to price
      uint256 _afterFeeUSDCin6dec = _beforeFeeInUSDCin6dec + _feeRoundedDownIn6dec;

      // pull USDC from user (_payer), push to this contract
      polygonUSDC.transferFrom(_payer, address(this), _afterFeeUSDCin6dec);

      // pushing fee from this contract to feeReceiver address
      polygonUSDC.transfer(feeReceiver, _feeRoundedDownIn6dec);

      // this contract gives the Aave lending pool allowance to pull in the amount without fee from this contract
      polygonUSDC.approve(address(polygonLendingPool), _beforeFeeInUSDCin6dec);

      // lending pool is queried to pull in the approved USDC (in 6 decimals unit)
      polygonLendingPool.deposit(address(polygonUSDC), _beforeFeeInUSDCin6dec, address(this), 0);
      emit LendingPoolDeposit(_beforeFeeInUSDCin6dec, _payer);
    } else {
      // on burning, fee is substracted from return
      uint256 _afterFeeUSDCin6dec = _beforeFeeInUSDCin6dec - _feeRoundedDownIn6dec;
            
      // lending pool is queried to push USDC (in 6 decimals unit) including fee back to this contract
      polygonLendingPool.withdraw(address(polygonUSDC), _beforeFeeInUSDCin6dec, address(this));
      emit LendingPoolWithdrawal(_beforeFeeInUSDCin6dec, _payee);

      // pushing fee from this contract to feeReceiver address
      polygonUSDC.transfer(feeReceiver, _feeRoundedDownIn6dec);

      // pushing USDC from this contract to user (_payee)
      polygonUSDC.transfer(_payee, _afterFeeUSDCin6dec);
    }
  }    

  // TODO: test and look at in depth
  // Withdraw available fees and interest gains from lending pool to receiver address.
  function withdrawGains(uint256 _amountIn6dec) public onlyOwner {
    uint256 availableIn6dec = polygonAMUSDC.balanceOf(address(this)) - reserveInUSDCin6dec;
    require(availableIn6dec > _amountIn6dec, "Insufficient funds.");
    polygonAMUSDC.transfer(feeReceiver, _amountIn6dec);
    emit ProfitTaken(availableIn6dec, _amountIn6dec);
  }

    function getDiscountLockStatus(address userToCheck) public view returns (bool) {
        return discountLockEngaged[userToCheck];
    }

    // shows how many blocks the user still has to wait until they can burn, transfer tokens, or disengage discounts lock
    // only affects users that have engaged the discounts lock to get discounts
    function getWaitingTime(address userToCheck) public view returns (uint256 blocksNeeded) {
      require(discountLockEngaged[userToCheck] == true, "Discount lock is not engaged.");

      uint256 blockNumNow = block.number;
      uint256 discountBlock = discountLockBlockHeight[userToCheck]; 
      require(discountBlock > 0, 'No registered holding time. Check if discounts lock is engaged.');                

      // amount of time that has passed since last account level upgrade or discount lock engagement
      // measured in blocks
      uint256 holdTime = blockNumNow - discountBlock;  
      uint256 blocksNecessary = blocksPerDay*levelHolds[getDiscountLevel(userToCheck)];

      int256 difference = int256(blocksNecessary) - int256(holdTime);

      uint256 blocksStillNeeded;

      if(difference<0){
        blocksStillNeeded = 0;
      } else {
        blocksStillNeeded = uint256(difference);
      }

      // number is positive if there is still time needed to wait
      // number is zero if discount lock timeout period has ended
      return blocksStillNeeded;
    }

    // Returns the reserveInUSDCin6dec tracker, which logs the amount of USDC (in 6 decimals format),
    // to be 100% backed against burning tokens at all times
    function getReserveIn6dec() public view returns (uint256 reserveInUSDCin6decNow) {
      return reserveInUSDCin6dec;
    }
    
    function getFeeReceiver() public view returns (address feeReceiverNow) {
      return feeReceiver;           
    } 

    function getPolygonUSDC() public view returns (address addressNow) {
      return address(polygonUSDC);           
    }

    function getPolygonAMUSDC() public view returns (address addressNow) {
      return address(polygonAMUSDC);           
    }

    function getBlocksPerDay() public view returns (uint256 amountOfBlocksPerDayNow) {
      return blocksPerDay;           
    }

    function getLevelAntes() public view returns (uint32[] memory levelAntesNow) {
      return levelAntes;           
    }

    function getLevelHolds() public view returns (uint16[] memory levelHoldsNow) {
      return levelHolds;           
    }

    function getLevelDiscounts() public view returns (uint8[] memory levelDiscountsNow) {
      return levelDiscounts;           
    }
      
  // function for owner to withdraw MATIC that were sent directly to contract by mistake
  function cleanMATICtips() public onlyOwner {
    address payable receiver = payable(msg.sender);
    uint256 accumulatedMatic = address(this).balance;
    (bool success, ) = receiver.call{value: accumulatedMatic}("");
    require(success, "Transfer failed.");
  }
    
  // function for owner to withdraw ERC20 tokens that were sent directly to contract by mistake
  function cleanERC20Tips(address erc20ContractAddress) public onlyOwner {
    require(erc20ContractAddress != 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174); // ERC20 address cannot be USDC
    require(erc20ContractAddress != 0x1a13F4Ca1d028320A707D99520AbFefca3998b7F); // ERC20 address cannot be amUSDC
    IERC20 erc20contract = IERC20(erc20ContractAddress);
    uint256 accumulatedTokens = erc20contract.balanceOf(address(this));
    erc20contract.transferFrom(address(this), msg.sender, accumulatedTokens);
  }

  // Fallback receives all incoming funds of any type.
  receive() external payable {
    // blind accumulate all other payment types and tokens.
  }

  /*  // TODO: talk to Aave, find out if they transfer funds to new lending pool or what
        // they want us to do in such a case, (maybe just simplify this function to set newAddress)
    
        // event for updating Aave's lendingPool address
        event LendingPoolUpdated(address account);  

        // NOTE: used to update in case a better Aave lendingpool comes out
        // Updating the lending pool and transfering all the deposited funds from it to the new one
        function updatePolygonLendingPool(address newAddress) public onlyOwner {
            // withdrawing all USDC from old lending pool address to BNJI contract
            polygonLendingPool.withdraw(address(polygonUSDC), type(uint).max, address(this));
            //emit LendingPoolWithdrawal (uint256 amount); // TODO: ideally find and emit the exact amount withdrawn

            // setting new lending pool address and emitting event
            polygonLendingPool = ILendingPool(newAddress);
            emit LendingPoolUpdated(newAddress);

            // getting USDC balance of BNJI contract, approving and depositing it to new lending pool
            uint256 bnjiContractUSDCBal = polygonUSDC.balanceOf(address(this));
            polygonUSDC.approve(address(polygonLendingPool), bnjiContractUSDCBal);
            polygonLendingPool.deposit(address(polygonUSDC), bnjiContractUSDCBal, address(this), 0);
            // emitting related event
            emit LendingPoolDeposit(bnjiContractUSDCBal, address(this));
        }
  */

  // Update the feeReceiver address.
  function updateFeeReceiver(address newFeeReceiver) public onlyOwner {
    feeReceiver = newFeeReceiver;     
    emit AddressUpdate(newFeeReceiver, "feeReceiver");           
  }  

  // Update the USDC token address on Polygon.
  function updatePolygonUSDC(address newAddress) public onlyOwner {
    polygonUSDC = IERC20(newAddress);
    emit AddressUpdate(newAddress, "polygonUSDC");
  }  

  // Update the amUSDC token address on Polygon.
  function updatePolygonAMUSDC(address newAddress) public onlyOwner {
    polygonAMUSDC = IERC20(newAddress);
    emit AddressUpdate(newAddress, "polygonAMUSDC");
  }

  // Update amount of blocks mined per day on Polygon
  function updateBlocksPerDay (uint256 newAmountOfBlocksPerDay) public onlyOwner {
    blocksPerDay = newAmountOfBlocksPerDay;
    emit BlocksPerDayUpdate(newAmountOfBlocksPerDay);
  }

  // Update approval from this contract to Aave's USDC lending pool.
  function updateApproveLendingPool (uint256 amountToApproveIn6dec) public onlyOwner {
    polygonUSDC.approve(address(polygonLendingPool), amountToApproveIn6dec);
    emit LendingPoolApprovalUpdate(amountToApproveIn6dec);
  }

  // Update token amount required for account levels
  function updateLevelAntes (uint32[] memory newLevelAntes) public onlyOwner {
    levelAntes = newLevelAntes;
    emit LevelAntesUpdate(newLevelAntes);
  }

  // Update timeout times required by account levels
  function updateLevelHolds (uint16[] memory newLevelHolds) public onlyOwner {
    levelHolds = newLevelHolds;
    emit LevelHoldsUpdate(newLevelHolds);
  }

  // Update fee discounts for account levels
  function updateLevelDiscounts (uint8[] memory newLevelDiscounts) public onlyOwner {
    levelDiscounts = newLevelDiscounts;
    emit LevelDiscountsUpdate(newLevelDiscounts);
  }   

}