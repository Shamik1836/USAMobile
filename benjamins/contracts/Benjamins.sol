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
contract Benjamins is Ownable, ERC20, Pausable, ReentrancyGuard {
    
    ILendingPool public polygonLendingPool; // Aave lending pool on Polygon
    IERC20 public polygonUSDC;              // USDC crypto currency on Polygon
    IERC20 public polygonAMUSDC;            // Aave's amUSDC crypto currency on Polygon

    address public feeReceiver;             // beneficiary address for collected fees

    uint256 public reserveInUSDCin6dec;     // end user USDC on deposit
    uint256 USDCscaleFactor = 1000000;      // 6 decimals scale of USDC crypto currency
    uint256 USDCcentsScaleFactor = 10000;   // 4 decimals scale of USDC crypto currency cents
    uint256 public blocksPerDay = 2;        // amount of blocks minted per day on polygon mainnet // TODO: change to 43200, value now is for testing
    uint8   private _decimals;              // storing BNJI decimals, set to 0 in constructor
    
    uint256 public curveFactor = 8000000;    // Inverse slope of the bonding curve.
    uint16  public baseFee = 2;             // in percent as an integer  // TODO: change to real value, this is for testing

    // Manage Discounts
    uint32[] public levelAntes;                    // how many BNJI are needed for each level;
    uint16[] public levelHolds;                    // how many blocks to hold are necessary before withdraw is unlocked, at each level;
    uint8[]  public levelDiscounts;                 // percentage discount given by each level;

    // This mapping keeps track of the blockheight, each time a user upgrades into a better account level
    mapping (address => uint256) discountLockBlockHeight;

    // This mapping keeps track of the users accounts' locking. 
    // Locking activates withdraw/burning timeout periods and grants discounts
    mapping (address => bool) lockEngaged;    

    constructor() ERC20("Benjamins", "BNJI") {
        // Manage Benjamins
        _decimals = 0;                      // Benjamins have 0 decimals, only full tokens exist.
        reserveInUSDCin6dec = 0;            // upon contract creation, the reserve in USDC is 0

        // setting addresses for feeReceiver, USDC-, amUSDC- and Aave lending pool contracts
        feeReceiver = 0xE51c8401fe1E70f78BBD3AC660692597D33dbaFF;
        polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
        polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);
        polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

        // Manage discounts TODO: finalize real numbers
        levelAntes =         [20, 60, 100, 500, 2000]; // in Benjamins
        levelHolds =     [ 0,  2,  7,  30,  90,  360]; // in days
        levelDiscounts = [ 0,  5, 10,  20,  40,   75]; // in percent

        // calling OpenZeppelin's (pausable) pause function for initial preparations after deployment
        pause();
    }
    
    // event for engaging and disengaging the account's discount locking features
    event LockStatus(address account, bool acccountIsLocked);   

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

    // Has the user held past the withdraw timeout?
    modifier withdrawAllowed(address userToCheck) {
        if (lockEngaged[userToCheck] == true) {
            uint256 blocksStillNecessary = getWaitingTime(userToCheck);
            require(blocksStillNecessary <= 0, 'Discount level withdraw timeout in effect.');
           
            /*
            // blockHeight right now
            uint256 blockNumNow = block.number;
            uint256 discountBlock = discountLockBlockHeight[userToCheck]; 
            require(discountBlock > 0, 'No registered holding time. Check if discounts lock is engaged.');                

            // amount of time that has passed since last account level upgrade, measured in blocks
            uint256 holdTime = blockNumNow - discountBlock;  
            
            console.log(msg.sender, 'msg.sender, withdrawAllowed, BNJ');
            console.log(userToCheck, 'userToCheck, withdrawAllowed, BNJ');
            console.log(blockNumNow, 'blockNumNow, withdrawAllowed, BNJ');
            console.log(holdTime, 'holdTime, withdrawAllowed, BNJ');
            console.log(blocksPerDay*levelHolds[discountLevel(userToCheck)], 'blocksPerDay*levelHolds[discountLevel(userToCheck)], withdrawAllowed, BNJ');
            */           
            // checking result against the withdrawal timeout period required by user's account level
            
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
        require(lockEngaged[msg.sender] == false, 'Discount lock already engaged for user.');
        lockEngaged[msg.sender] = true;       
        discountLockBlockHeight[msg.sender] = block.number;   
        emit LockStatus(msg.sender, true);
    }

    function disengageDiscountLock() public whenAvailable withdrawAllowed(msg.sender) {
        require(lockEngaged[msg.sender] == true, 'Discount lock already disengaged for user.');
        lockEngaged[msg.sender] = false;
        discountLockBlockHeight[msg.sender] = 0;   
        emit LockStatus(msg.sender, false);
    }

    // calculating fees for transfers
    function calcTransportFee(uint256 amountOfBNJI) public view whenAvailable returns (uint256) {
        // calculating USDC value of BNJI)
        uint256 beforeFeeInUSDCin6dec = quoteUSDC(amountOfBNJI, false);
        // calculating the fee, rounding it down to full cents and returning the result
        uint256 feeNotRoundedIn6dec = beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender))/ USDCscaleFactor;
        uint256 feeRoundedDownIn6dec = feeNotRoundedIn6dec - (feeNotRoundedIn6dec % USDCcentsScaleFactor);
        return feeRoundedDownIn6dec;
    }

    // Modified ERC20 transfer() 
    // User needs to give this contract an approval for the necessary transportFeeRoundedIn6dec via the USDC contract
    // To get the necessary value, user can call calcTransportFee, see above
    // This must have happened before calling this function, or it will revert
    // Cannot send until holding time is passed for sender.
    // Creates possible lockout time for receiver.
    function transfer(address recipient, uint256 amount)
        public
        override
        nonReentrant
        whenAvailable
        withdrawAllowed(_msgSender())
        returns(bool) {        
        //checking recipient's discount level before transfer
        uint8 originalUserDiscountLevel = discountLevel(recipient);

        // calculating transport fee
        uint256 transportFeeRoundedIn6dec = calcTransportFee(amount);

        // at this point, user must have given USDC approval for transportFeeRoundedIn6dec, or call will revert
        // pull USDC from user (_msgSender()), push to feeReceiver
        polygonUSDC.transferFrom(_msgSender(), feeReceiver, transportFeeRoundedIn6dec); // TODO: verify this call works as intended

        // transferring BNJI
        _transfer(_msgSender(), recipient, amount);
        
        //checking recipient's discount level after changes        
        uint8 newUserDiscountLevel = discountLevel(recipient);
        // if discount level is different now, adjusting the holding times
        if ( newUserDiscountLevel > originalUserDiscountLevel){
           newLevelReached(recipient);
        }
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
        //checking recipient's discount level before transfer
        uint8 originalUserDiscountLevel = discountLevel(recipient);

        // calculating transport fee in USDC
        uint256 transportFeeRoundedIn6dec = calcTransportFee(amountBNJI);

        // pull USDC from user (sender), push to feeReceiver
        polygonUSDC.transferFrom(sender, feeReceiver, transportFeeRoundedIn6dec); // TODO: verify this call works as intended 

        // checking if allowance for BNJI is enough
        uint256 currentBNJIAllowance = allowance(sender, _msgSender());
        require(currentBNJIAllowance >= amountBNJI, "Benjamins: transfer amount exceeds allowance");

        // transferring BNJI
        _transfer (sender, recipient, amountBNJI);

        // decreasing BNJI allowance by transferred amount
        _approve(sender, _msgSender(), currentBNJIAllowance - amountBNJI);
             
        //checking recipient's discount level after changes
        uint8 newUserDiscountLevel = discountLevel(recipient);

        // if discount level is different now, adjusting the holding times
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            newLevelReached(recipient);
        }
        return true;
    }

    // Buy BNJI with USDC.
    function mint(uint256 _amount) public {
        mintTo(_amount, msg.sender);
    }

    // Buy BNJI with USDC for another address
    function mintTo(uint256 _amount, address _toWhom) public whenAvailable {        
        // Checking user's discount level before mint
        uint8 originalUserDiscountLevel = discountLevel(_toWhom);
        // minting to user
        changeSupply(_toWhom, _amount, true);        
        // comparing user's discount level now to before
        uint8 newUserDiscountLevel = discountLevel(_toWhom);
        // if new discount level was reached, updating the holding time timeout
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            newLevelReached(_toWhom);
        }
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

        if (isMint==true){                                  // this calculation is for minting BNJI
            supplyAfterTx = supply + _amount;               // post-mint supply on mint
            supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
            squareDiff = supplyAfterTx2 - supply2;
        } 
        
        else {                                              // this calculation is for burning BNJI
            supplyAfterTx = supply - _amount;               // post-mint supply on burn
            supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
            squareDiff = supply2 - supplyAfterTx2;
        }

        uint256 scaledSquareDiff = squareDiff * USDCscaleFactor;        // bringing difference into 6 decimals for USDC
        uint256 amountInUSDCin6dec = scaledSquareDiff / curveFactor;    // finishing bonding curve calculation
        uint256 stubble = amountInUSDCin6dec % USDCcentsScaleFactor;    // defining sub-cent value
        uint256 endAmountUSDCin6dec = amountInUSDCin6dec - stubble;     // rounding down to USDC cents
        require (endAmountUSDCin6dec >= 5000000, "BNJ, quoteUSDC: Minimum BNJI value to move is $5 USDC" );
        return endAmountUSDCin6dec;                                     // returning USDC value of BNJI before fees
    }

    // Return address discount level as an uint8 as a function of balance.
    function discountLevel(address _userToCheck) public view whenAvailable returns(uint8) {
        // discount level is only applied if user has engaged the discounts lock
        if (lockEngaged[_userToCheck] == true) {
            uint256 userBalance = balanceOf(_userToCheck); // lookup once.
            uint8 currentLevel = 0;
            for (uint8 index = 0; index < levelAntes.length ; index++){
                if (userBalance >= levelAntes[index]) {
                    currentLevel++;
                }
            }
            return currentLevel;
        } else {
            return 0;
        }
    }

    // Quote % fee the given user will be charged based on their
    // current balance, Tx amount, and contents of the discount lookup table.
    // Returns a percentage * 10,000.
    function quoteFeePercentage(address forWhom)
        public
        view
        whenAvailable
        returns (uint16)
    {
        return 100*baseFee*uint16(100-levelDiscounts[discountLevel(forWhom)]); // 10,000x %
    }

    // Execute mint (positive amount) or burn (negative amount).
    function changeSupply(address _forWhom, uint256 _amountBNJI, bool isMint) internal nonReentrant whenAvailable {
        uint256 beforeFeeInUSDCin6dec;
        // Calculate change in tokens and value of difference
        if (isMint == true) {
            beforeFeeInUSDCin6dec = quoteUSDC(_amountBNJI, true);
        } else {
            beforeFeeInUSDCin6dec = quoteUSDC(_amountBNJI, false);
        }
        uint256 feeNotRoundedIn6dec = (beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender)))/ USDCscaleFactor;
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

    // Updating time counter measuring holding times, triggered when reaching new account level
    function newLevelReached(address _toWhom) internal whenAvailable returns (bool) {
        discountLockBlockHeight[_toWhom] = block.number;
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
        return lockEngaged[userToCheck];
    }

    // shows how many blocks the user still has to wait until they can burn, transfer tokens, or disengage discounts lock
    // only affects users that have engaged the discounts lock to get discounts
    function getWaitingTime(address userToCheck) public view returns (uint256 blocksNeeded) {
        require(lockEngaged[userToCheck] == true, "Discount lock is not engaged.");

        uint256 blockNumNow = block.number;
        uint256 discountBlock = discountLockBlockHeight[userToCheck]; 
        require(discountBlock > 0, 'No registered holding time. Check if discounts lock is engaged.');                

        // amount of time that has passed since last account level upgrade or discount lock engagement
        // measured in blocks
        uint256 holdTime = blockNumNow - discountBlock;  
        uint256 blocksNecessary = blocksPerDay*levelHolds[discountLevel(userToCheck)];

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