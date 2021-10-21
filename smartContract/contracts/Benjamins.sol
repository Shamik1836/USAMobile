// SPDX-License-Identifier: NONE
pragma solidity ^0.8.0;

import "./ILendingPool.sol"; // TODO: maybe get interface from some specific source?
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// importing openzeppelin interface for ERC20 tokens
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

// BNJI Utility Token.
// Price is set via bonding curve vs. USDC.
// All USDC is deposited in a singular lending pool (nominaly at AAVE).
// 100% reserveInUSDC USDC is maintained against burning.
// Collected fees and interest are withdrawable to the owner to a set recipient address.
// Fee discounts are calculated based on balance.
// There is a 10 block lockup vs. flash loan attacks.
// Discounts and level holds are staged vs. a lookup table.
contract OurToken is Ownable, ERC20, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    // Manage Benjamins
    ILendingPool public polygonLendingPool;
    IERC20 public polygonUSDC;
    IERC20 public polygonAMUSDC;

    address depositAccount; // lending pool address // TODO: take out / re-work, lending pool needs interface
    uint256 reserveInUSDC; // end user USDC on deposit
    address feeReceiver; // beneficiary address for amUSDC interest
    uint256 USDCscaleFactor = 1000000; // sets bonding curve slope (permanent, hardcoded)
    uint8 private _decimals;

    // Manage Discounts
    mapping (address => uint256) lastUpgradeBlockHeight;
    uint[] levelAntes; // how many BNJI needed for each level;
    uint[] levelHolds; // how many blocks to hold b4 withdraw @ each level;
    uint8[] levelDiscounts; // percentage discount given by each level;
    uint8 antiFlashLoan = 10; // number of blocks hold to defend vs. flash loans.
    uint blocksPerDay = 2; // TODO: change to 43200
    uint32 curveFactor = 800000; // Inverselope of the bonding curve.
    uint8 baseFee = 2; // in percent as an integer

    constructor() ERC20("Benjamins", "BNJI") {
        // Manage Benjamins        
        reserveInUSDC = 0;
        feeReceiver = owner();
        polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
        polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);
        polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

        // Manage discounts TODO: finalize real numbers
        levelAntes =    [ 0, 20, 60, 100, 500, 2000]; // in Benjamins
        levelHolds =    [ 0, 2,   7,  30,  90,  360]; // days
        levelDiscounts = [ 0, 5,  10,  20,  40,   75]; // in percent*100
        pause();
    }

    event newDepositAccount(address account);
    event newFeeReceiver(address beneficiary);
    event exchanged(
        address fromAddress,
        address toAddress,
        int256 inTokens,
        int256 inUSDC,
        uint256 fee
    );
    event profitTaken(uint256 available, uint256 _amountUSDCin6dec);
    event LendingPoolDeposit (uint256 amount);  
    event LendingPoolWithdrawal (uint256 amount);

    // owner overrides paused.
    modifier whenAvailable() {
        require(!paused() || (msg.sender == owner()), "Benjamins is paused.");
        _;
    }
    // Account has sufficient funds
    modifier hasTheBenjamins(uint256 want2Spend) {
        require(balanceOf(msg.sender) >= want2Spend, "Insufficient Benjamins.");
        _;
    }
    /*
    // Update lending pool deposit account address
    function setDepositAccount(address lendingPool) public whenAvailable {
        // BC TODO: transfer all funds from old to new account...
        depositAccount = lendingPool;
        emit newDepositAccount(lendingPool);
    }
    */
    function updatePolygonLendingPool(address newAddress) public onlyOwner whenAvailable { 
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
        emit LendingPoolDeposit(bnjiContractUSDCBal);          
    }
    
    // Update the feeReceiver address.
    function setFeeReceiver(address beneficiary) public whenAvailable {
        feeReceiver = beneficiary;
        emit newFeeReceiver(beneficiary);
    }
    
    // pausing funcionality from OpenZeppelin's Pausable
    function pause() public onlyOwner {
        _pause();
    }

    // unpausing funcionality from OpenZeppelin's Pausable
    function unpause() public onlyOwner {
        _unpause();
    }

    // OZ recommends overriding this vs. setting it.
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    // Quote USDC for mint(positive) or burn(negative)
    // based on circulation and amount (and sign of amount)
    function quoteUSDC(int256 _amount) public view returns (int256) {
        // Basic integral
        uint256 supply = totalSupply();
        uint256 supply2 = supply*supply;  // Supply squared
        uint256 supplyAfterTx = supply + _amount; // post-mint supply squared
        uint256 supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
        int256 squareDiff = int256(supplyAfterTx2) - int256(supply2);
        int256 scaledSquareDiff = squareDiff * USDCscaleFactor;
        int256 amountInUSDC6decimals = scaledSquareDiff / curveFactor;
        int256 stubble = amountInUSDC6decimals % 10000; // shave to USDC cents
        return amountInUSDC6decimals - stubble;
    }

    // Return address discount level as an uint8 as a function of balance.
    function discountLevel(address _whom) public view returns(uint8) {
        uint256 userBalance = balanceOf(_whom); // lookup once.
        uint8 currentLevel;
        for (currentLevel = 0; levelAntes[currentLevel+1] <= userBalance; currentLevel ++){
            if (currentLevel == levelAntes.length) {break;}
        }   
        return currentLevel;
    }

        // Are we past the withdraw timeout?
    modifier withdrawAllowed(address userToCheck) {
        uint256 holdTime = (block.number - lastUpgradeBlockHeight[msg.sender]); 
        require(holdTime > antiFlashLoan, 
            'Anti-flashloan withdraw timeout in effect.');
        require(holdTime > blocksPerDay*levelHolds[discountLevel(msg.sender)], 
            'Discount level withdraw timeout in effect.');
        _;
    }
    // Redundant reserveInUSDC protection vs. user withdraws.
    modifier wontBreakTheBank(uint256 want2Burn) {
        require(reserveInUSDC >= quoteUSDC(int256(want2Burn)));
        _;
    }

    // Quote % fee the given user will be charged based on their
    // current balance, Tx amount, and contents of the discount lookup table.
    // Returns a percentage * 10,000.
    function quoteFeePercentage(address forWhom)
        public
        view
        returns (uint16)
    {
        return uint16(100*baseFee)*uint16(100-levelDiscounts[discountLevel(forWhom)]); // 10,000x %
    }

    // Move USDC for a supply chainge.  Note: sign of amount is the mint/burn direction.
    function moveUSDC(
        address _payer,
        address _payee,
        int256 _amount
    ) internal {
        if (_amount > 0) {
            // pull USDC from user (_payer), push to lending pool (_payee)            
            // BC TODO: AAVE/USDC function goes here.
            // this contract gives the Aave lending pool allowance to pull in _amount of USDC (in 6 decimals unit)  
            polygonUSDC.approve(address(polygonLendingPool), _amount); // TODO: check if this is coming in formatted in 6 decimal units, i.e. USDC * 1000000 or cents * 10000
            // lending pool is queried to pull in the approved USDC (in 6 decimals unit)  
            polygonLendingPool.deposit(address(polygonUSDC), _amount, address(this), 0); // TODO: also needs 6 decimals format
            emit LendingPoolDeposit(_amount);
        } else {
            // pull USDC from lending pool (_payer), push to user (_payee)
            // BC TODO: AAVE/USDC function goes here.
           polygonLendingPool.withdraw(address(polygonUSDC), _amount, address(this)); // TODO: also needs 6 decimals format
           emit LendingPoolWithdrawal(_amount);
        }
    }

    // Absolute value function needed to make fee work for burn
    function abs(int x) private pure returns (int) {
        return x >= 0 ? x : -x;
    }

    // Execute mint (positive amount) or burn (negative amount).
    function changeSupply(address _forWhom, int256 _amount) internal nonReentrant {
        // Calculate change
        int256 principleInUSDCcents = quoteUSDC(_amount); // negative on burn
        int256 fee = abs(principleInUSDCcents * quoteFeePercentage(msg.sender))/10000; // always positive
        int256 endAmountInUSDCcents = principleInUSDCcents + fee; // User will be charged this in USDC cents

        // Execute exchange
        if (_amount > 0) {
            // minting
            moveUSDC(msg.sender, depositAccount, endAmountInUSDCcents);
            _mint(_forWhom, _amount);
        } else {
            // burning
            moveUSDC(depositAccount, _forWhom, endAmountInUSDCcents);
            _burn(msg.sender, -_amount);
        }

        // Record change.
        reserveInUSDC += principleInUSDCcents;
        emit exchanged(msg.sender, _forWhom, _amount, -endAmountInUSDCcents, fee);
    }

    // Only reset last upgrade block height if its a new hold.
    function adjustUpgradeTimeouts(address _toWhom) internal returns (bool) {
        uint256 timeSinceLastHoldStart = block.number - lastUpgradeBlockHeight[_toWhom];
        int256 timeSinceLastHoldEnd = timeSinceLastHoldStart - levelHolds[discountLevel(_toWhom)-1];
        if (timeSinceLastHoldEnd > 0) {
            lastUpgradeBlockHeight[_toWhom] = block.number; 
        }
    }

    // Buy BNJI with USDC for another address
    function mintTo(uint256 _amount, address _toWhom) public whenAvailable {
        uint8 originalUserDiscountLevel = discountLevel(_toWhom);
        changeSupply(_toWhom, int256(_amount));
        uint8 newUserDiscountLevel = discountLevel(_toWhom);
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            adjustUpgradeTimeouts(_toWhom);
        }
    }

    // Buy BNJI with USDC.
    function mint(uint256 _amount) public {
        mintTo(_amount, msg.sender);
    }

    // Sell your BNJI and send USDC to another address.
    function burnTo(uint256 _amount, address _toWhom)
        public
        whenAvailable
        hasTheBenjamins(_amount)
        wontBreakTheBank(_amount)
        withdrawAllowed(msg.sender)
    {
        changeSupply(_toWhom, int256(-_amount));
    }

    // Sell BNJI for USDC.
    function burn(uint256 _amount) public {
        burnTo(_amount, msg.sender);
    }

    // modify ERC20 transferFrom()
    // Cannot send until holding time is passed for sender.
    // Creates possible lockout time for receiver.
    function transferFrom(address sender, address recipiant, uint256 amount) 
        public 
        override 
        nonReentrant
        withdrawAllowed(sender) 
        returns (bool) {
            uint8 originalUserDiscountLevel = discountLevel(recipiant);
            /*return*/ _transfer (sender, recipiant, amount);   // TODO: clarify, what is meant / intended by return in this context? lines below will not be read?
            uint8 newUserDiscountLevel = discountLevel(recipiant);
            if ( newUserDiscountLevel > originalUserDiscountLevel){
                adjustUpgradeTimeouts(recipiant);
            }
            return true;
        }
    
    // modify ERC20 transfer()
    function transfer(address recipiant, uint256 amount) 
        public 
        override 
        returns(bool) {
        return transferFrom(msg.sender, recipiant, amount);
    }

    // Withdraw available fees and interest gains from lending pool to receiver address.
    function withdrawGains(uint256 _amountIn6dec) public onlyOwner {       
        uint256 available = polygonAMUSDC.balanceOf(address(this)) - reserveInUSDC;
        require(available > _amountIn6dec, "Insufficient funds.");        
        polygonAMUSDC.transfer(feeReceiver, _amountIn6dec);
        emit profitTaken(available, _amountIn6dec);
    }

    // function for owner to withdraw errant ERC20 tokens
    function scavengeERC20Tip(address ERC20ContractAddress) public onlyOwner {
        IERC20 USDCcontractIF = IERC20(ERC20ContractAddress);
        uint256 accumulatedTokens = USDCcontractIF.balanceOf(address(this));
        USDCcontractIF.transferFrom(address(this), feeReceiver, accumulatedTokens);
    }

    /* TODO: needs testing, is not supposed to call the imported ERC20 transfer function, but instead the original Ethereum function to transfer network native funds, MATIC
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
}
