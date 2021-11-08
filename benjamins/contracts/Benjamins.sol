// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

// importing interface for Aave's lending pool
import "./ILendingPool.sol"; // TODO: maybe get interface from some specific source?
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
// There is a 10 block lockup vs. flash loan attacks.
// Discounts and level holds are staged vs. a lookup table.
contract Benjamins is Ownable, ERC20, Pausable, ReentrancyGuard {
    using SafeMath for uint256;             // TODO: complete for other datatypes or out? use .add, etc?

    ILendingPool public polygonLendingPool; // Aave lending pool on Polygon
    IERC20 public polygonUSDC;              // USDC crypto currency on Polygon
    IERC20 public polygonAMUSDC;            // Aave's amUSDC crypto currency on Polygon

    address feeReceiver;                    // beneficiary address for collected fees

    uint256 reserveInUSDCin6dec;            // end user USDC on deposit
    uint256 USDCscaleFactor = 1000000;      // 6 decimals scale of USDC crypto currency
    uint256 USDCcentsScaleFactor = 10000;   // 4 decimals scale of USDC crypto currency cents
    uint256 blocksPerDay = 2;               // amount of blocks minted per day on polygon mainnet // TODO: change to 43200, value now is for testing
    uint8 private _decimals;                // storing BNJI decimals, set to 0 in constructor

    uint8 antiFlashLoan = 10;               // number of blocks hold to defend vs. flash loans.
    uint256 curveFactor = 800000;           // Inverse slope of the bonding curve.
    uint16 baseFee = 2;                     // in percent as an integer  // TODO: change to real value, this is for testing

    // Manage Discounts
    uint32[] levelAntes;                    // how many BNJI are needed for each level;
    uint16[] levelHolds;                    // how many blocks to hold are necessary before withdraw is unlocked, at each level;
    uint8[] levelDiscounts;                 // percentage discount given by each level;

    // This mapping keeps track of the blockheight, each time a user upgrades into a better account level
    mapping (address => uint256) lastUpgradeBlockHeight;

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
        levelAntes =     [    20, 60, 100, 500, 2000]; // in Benjamins
        levelHolds =     [ 0,  2,  7,  30,  90,  360]; // in days
        levelDiscounts = [ 0,  5, 10,  20,  40,   75]; // in percent

        // calling OpenZeppelin's (pausable) pause function for initial preparations after deployment
        pause();
    }

    // event for updating Aave's lendingPool address
    event newDepositAccount(address account);

    // event for updating feeReceiver address
    event newFeeReceiver(address beneficiary);      

    // event for exchanging USDC and BNJI
    event exchanged(
        address fromAddress,
        address toAddress,
        uint256 inTokens,
        uint256 beforeFeeUSDCin6dec,
        uint256 feeUSDCin6dec
    );

    // event for withdrawGains function
    // availableIn6dec shows how many USDC were available to withdraw, in 6 decimals format
    // amountUSDCin6dec shows how many USDC were withdrawn, in 6 decimals format
    event profitTaken(uint256 availableIn6dec, uint256 amountUSDCin6dec);

    // event for deposits into the lending pool
    event LendingPoolDeposit (uint256 amountUSDCin6dec, address payer);

    // event for withdrawals from the lending pool
    event LendingPoolWithdrawal (uint256 amountUSDCBeforeFeein6dec, address payee);

    // owner overrides paused.
    modifier whenAvailable() {
        require(!paused() || (_msgSender() == owner()), "Benjamins is paused.");
        _;
    }

    // checking that account has sufficient funds
    modifier hasTheBenjamins(uint256 want2Spend) {
        require(balanceOf(msg.sender) >= want2Spend, "Insufficient Benjamins.");
        _;
    }

    // Has the user held past the withdraw timeout?
    modifier withdrawAllowed(address userToCheck) {
        // blockHeight right now
        uint256 blockNum = block.number;
        // amount of time that has passed since last account level upgrade, measured in blocks
        uint256 holdTime = blockNum - lastUpgradeBlockHeight[userToCheck];
        // checking whether the result is larger than the required flashloan protection variable, antiFlashLoan
        require(holdTime > antiFlashLoan, 'Anti-flashloan withdraw timeout in effect.');
        // checking result against the withdrawal timeout period required by user's account level
        require(holdTime >  blocksPerDay*levelHolds[discountLevel(userToCheck)],
            'Discount level withdraw timeout in effect.');
        _;
    }

    // Redundant reserveInUSDCin6dec protection vs. user withdraws.
    modifier wontBreakTheBank(uint256 amountBNJItoBurn) {
        require(reserveInUSDCin6dec >= quoteUSDC(amountBNJItoBurn, false));
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

    // calculating fees for transfers
    function calcTransportFee(uint256 amountOfBNJI) public view whenAvailable returns (uint256) {
        // calculating USDC value of BNJI)
        uint256 beforeFeeInUSDCin6dec = quoteUSDC(amountOfBNJI, false);
        // calculating the fee, rounding it down to full cents and returning the result
        uint256 fee = beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender))/ USDCscaleFactor;
        uint256 feeRoundedDownIn6dec = fee - (fee % USDCcentsScaleFactor);
        return feeRoundedDownIn6dec;
    }

    // Modified ERC20 transfer() // TODO: use msg.sender or _msgSender() ?
    // User needs to give this contract an approval for the necessary transportFeeRoundedIn6dec via the USDC contract
    // To get the necessary value, user can call calcTransportFee, see above
    // This must have happened before calling this function, or it will revert
    // Cannot send until holding time is passed for sender.
    // Creates possible lockout time for receiver.
    function transfer(address recipient, uint256 amount)
        public
        override
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

        //checking recipient's discount level after changes        // TODO: check/think about senders discount level/holding times
        uint8 newUserDiscountLevel = discountLevel(recipient);
        // if discount level is different now, adjusting the holding times
        if ( newUserDiscountLevel > originalUserDiscountLevel){
           newLevelReached(recipient);
        }
        return true;
    }

    // modified ERC20 transferFrom() // TODO: use msg.sender or _msgSender() ?
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
        // Checking user's discount level
        uint8 originalUserDiscountLevel = discountLevel(_toWhom);
        // minting to user
        changeSupply(_toWhom, _amount, true);
        uint8 newUserDiscountLevel = discountLevel(_toWhom);
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
    function discountLevel(address _whom) public view whenAvailable returns(uint8) {
        uint256 userBalance = balanceOf(_whom); // lookup once.
        uint8 currentLevel = 0;
        for (uint8 index = 0; index < levelAntes.length ; index++){
            if (userBalance >= levelAntes[index]) {
                currentLevel++;
            }
        }
        return currentLevel;
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
        uint256 fee = (beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender)))/ USDCscaleFactor;
        uint256 feeRoundedDownIn6dec = fee - (fee % USDCcentsScaleFactor);
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

        emit exchanged(msg.sender, _forWhom, _amountBNJI, beforeFeeInUSDCin6dec, feeRoundedDownIn6dec);
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
        lastUpgradeBlockHeight[_toWhom] = block.number;
    }

    // Withdraw available fees and interest gains from lending pool to receiver address.
    function withdrawGains(uint256 _amountIn6dec) public onlyOwner {
        uint256 availableIn6dec = polygonAMUSDC.balanceOf(address(this)) - reserveInUSDCin6dec;
        require(availableIn6dec > _amountIn6dec, "Insufficient funds.");
        polygonAMUSDC.transfer(feeReceiver, _amountIn6dec);
        emit profitTaken(availableIn6dec, _amountIn6dec);
    }

    // function for owner to withdraw errant ERC20 tokens
    function scavengeERC20Tip(address ERC20ContractAddress) public onlyOwner {
        IERC20 USDCcontractIF = IERC20(ERC20ContractAddress);
        uint256 accumulatedTokens = USDCcontractIF.balanceOf(address(this));
        USDCcontractIF.transferFrom(address(this), feeReceiver, accumulatedTokens);
    }

    // Shows the reserveInUSDCin6dec tracker, which logs the amount of USDC (in 6 decimals format),
    // to be 100% backed against burning at all times
    function showReserveIn6dec() public view returns (uint256) {
        return reserveInUSDCin6dec;
    }

    /* TODO: needs testing, (is not supposed to call the imported ERC20 transfer function!, but instead the original Ethereum function to transfer network native funds, MATIC)
    // now uses "call" instead of "transfer" to safeguard against calling the wrong function by mistake
    // function for owner to withdraw all errant MATIC to feeReceiver
    function scavengeTips() public onlyOwner {
        address payable receiver = payable(msg.sender);
        (bool success, ) = receiver.call.value(amount)("");
        require(success, "Transfer failed.");
    }
    */

    // Fallback receives all incoming funds of any type.
    receive() external payable {
        // blind accumulate all other payment types and tokens.
    }

    // TODO: probably either verify or simplify
    // Updating the lending pool and transfering all the depositted funds from it to the new one
    function updatePolygonLendingPool(address newAddress) public onlyOwner {
        // withdrawing all USDC from old lending pool address to BNJI contract
        polygonLendingPool.withdraw(address(polygonUSDC), type(uint).max, address(this));
        //emit LendingPoolWithdrawal (uint256 amount); // TODO: ideally find and emit the exact amount withdrawn

        // setting new lending pool address and emitting event
        polygonLendingPool = ILendingPool(newAddress);
        emit newDepositAccount(newAddress);

        // getting USDC balance of BNJI contract, approving and depositing it to new lending pool
        uint256 bnjiContractUSDCBal = polygonUSDC.balanceOf(address(this));
        polygonUSDC.approve(address(polygonLendingPool), bnjiContractUSDCBal);
        polygonLendingPool.deposit(address(polygonUSDC), bnjiContractUSDCBal, address(this), 0);
        // emitting related event
        emit LendingPoolDeposit(bnjiContractUSDCBal, address(this));
    }

    // Update the feeReceiver address.
    function setFeeReceiver(address beneficiary) public onlyOwner {
        feeReceiver = beneficiary;
        emit newFeeReceiver(beneficiary);
    }

    // Update the USDC token address on Polygon.
    function updatePolygonUSDC(address newAddress) public onlyOwner {
    polygonUSDC = IERC20(newAddress);
    }

     // Update the amUSDC token address on Polygon.
    function updatePolygonAMUSDC(address newAddress) public onlyOwner {
        polygonAMUSDC = IERC20(newAddress);
    }

     // Update approval from this contract to Aave's lending pool.
    function updateApproveLendingPool (uint256 amountToApprove) public onlyOwner {
        polygonUSDC.approve(address(polygonLendingPool), amountToApprove);
    }

    // Update token amount required for account levels
    function updateLevelAntes (uint32[] memory newLevelAntes) public onlyOwner {
        levelAntes = newLevelAntes;
    }

    // Update timeout times required by account levels
    function updateLevelHolds (uint16[] memory newLevelHolds) public onlyOwner {
        levelHolds = newLevelHolds;
    }

    // Update fee discounts for account levels
    function updateLevelDiscounts (uint8[] memory newLevelDiscounts) public onlyOwner {
        levelDiscounts = newLevelDiscounts;
    }

    // Update amount of blocks mined per day on Polygon
    function updateBlocksPerDay (uint256 newAmountOfBlocksPerDay) public onlyOwner {
        blocksPerDay = newAmountOfBlocksPerDay;
    }
}