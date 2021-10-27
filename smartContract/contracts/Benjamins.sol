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
contract Benjamins is Ownable, ERC20, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    // Manage Benjamins
    ILendingPool public polygonLendingPool;
    IERC20 public polygonUSDC;
    IERC20 public polygonAMUSDC;

    //address depositAccount; // lending pool address // TODO: take out / re-work, lending pool needs interface
    uint256 reserveInUSDCin6dec; // end user USDC on deposit
    address feeReceiver; // beneficiary address for amUSDC interest
    uint256 USDCscaleFactor = 1000000; // sets bonding curve slope (permanent, hardcoded)
    uint8 private _decimals;
    
    // Manage Discounts
    mapping (address => uint256) lastUpgradeBlockHeight;
    uint32[] levelAntes; // how many BNJI needed for each level;
    uint16[] levelHolds;   // how many blocks to hold b4 withdraw @ each level;    
    uint8[] levelDiscounts; // percentage discount given by each level;
    uint8 antiFlashLoan = 10; // number of blocks hold to defend vs. flash loans.
    uint blocksPerDay = 2; // TODO: change to 43200
    uint256 curveFactor = 800000; // Inverselope of the bonding curve.
    uint8 baseFee = 1; // in percent as an integer  // TODO: change to real value, this is for testing

    constructor() ERC20("Benjamins", "BNJI") {
        // Manage Benjamins
        _decimals = 0;        
        reserveInUSDCin6dec = 0;
        feeReceiver = 0xE51c8401fe1E70f78BBD3AC660692597D33dbaFF;
        polygonUSDC = IERC20(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174);
        polygonAMUSDC = IERC20(0x1a13F4Ca1d028320A707D99520AbFefca3998b7F);
        polygonLendingPool = ILendingPool(0x8dFf5E27EA6b7AC08EbFdf9eB090F32ee9a30fcf);

        // Manage discounts TODO: finalize real numbers
        levelAntes =     [    20, 60, 100, 500, 2000]; // in Benjamins
        levelHolds =     [ 0,  2,  7,  30,  90,  360]; // Forced type.  Disallow assumption.
        levelDiscounts = [ 0,  5, 10,  20,  40,   75]; // in percent*100, forced type
                
        pause(); // TODO: verify this fires correctly, since pausable unpauses via its constructor
    }

    event newDepositAccount(address account);
    event newFeeReceiver(address beneficiary);
    event exchanged(
        address fromAddress,
        address toAddress,
        uint256 inTokens,
        uint256 inUSDC,
        uint256 fee
    );
    event profitTaken(uint256 availableIn6dec, uint256 amountUSDCin6dec);
    event LendingPoolDeposit (uint256 amountUSDCin6dec, address payer);  
    event LendingPoolWithdrawal (uint256 amountUSDCin6dec, address payee);

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

    // Are we past the withdraw timeout?
    modifier withdrawAllowed(address userToCheck) {
        uint256 blockNum = block.number;
        uint256 holdTime = blockNum - lastUpgradeBlockHeight[userToCheck]; 
        console.log('holdTime calculated:', holdTime);
        console.log('holdTime necessary, i.e. blocksPerDay*levelHolds[discountLevel(userToCheck)]:', blocksPerDay*levelHolds[discountLevel(userToCheck)]);
        require(holdTime > antiFlashLoan, 
            'Anti-flashloan withdraw timeout in effect.');
        require(holdTime >  blocksPerDay*levelHolds[discountLevel(userToCheck)], 
            'Discount level withdraw timeout in effect.');
        _;
    }
 
    // Redundant reserveInUSDC protection vs. user withdraws.
    modifier wontBreakTheBank(uint256 want2BurnIn6dec) {
        require(reserveInUSDCin6dec >= quoteUSDC(want2BurnIn6dec));   // should implicitly do an abs().
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

    // OZ recommends overriding this vs. setting it.
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    // modified ERC20 transfer()
    function transfer(address recipient, uint256 amount) 
        public 
        override 
        returns(bool) {
        //checking recipient's discount level before transfer
        uint8 originalUserDiscountLevel = discountLevel(recipient); 
        _transfer(_msgSender(), recipient, amount);
        //checking recipient's discount level after changes            
        uint8 newUserDiscountLevel = discountLevel(recipient);
        // if discount level is different now, adjusting the holding times 
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            adjustUpgradeTimeouts(recipient);
        }
        return true;
    } 

    // modified ERC20 transferFrom() // TODO: use msg.sender or _msgSender() ?
    // Cannot send until holding time is passed for sender.
    // Creates possible lockout time for receiver.
    function transferFrom(address sender, address recipient, uint256 amount) 
        public 
        override 
        nonReentrant
        withdrawAllowed(sender) 
    returns (bool) {
        //checking recipient's discount level before transfer
        uint8 originalUserDiscountLevel = discountLevel(recipient); 
        // transferring funds
        _transfer (sender, recipient, amount); 
        // checking if allowance was enough
        uint256 currentAllowance = allowance(sender, _msgSender());        
        require(currentAllowance >= amount, "ERC20: transfer amount exceeds allowance");
        // decreasing allowance by transferred amount
        _approve(sender, _msgSender(), currentAllowance - amount);   
        //checking recipient's discount level after changes            
        uint8 newUserDiscountLevel = discountLevel(recipient);
        // if discount level is different now, adjusting the holding times 
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            adjustUpgradeTimeouts(recipient);
        }
        return true;
    }

    // Buy BNJI with USDC.
    function mint(uint256 _amount) public {
        mintTo(_amount, msg.sender);
    }

    // Buy BNJI with USDC for another address
    function mintTo(uint256 _amount, address _toWhom) public whenAvailable {
        uint8 originalUserDiscountLevel = discountLevel(_toWhom);
        changeSupply(_toWhom, _amount);
        uint8 newUserDiscountLevel = discountLevel(_toWhom);
        if ( newUserDiscountLevel > originalUserDiscountLevel){
            adjustUpgradeTimeouts(_toWhom);
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
        changeSupply(_toWhom, _amount);
    }

    // Quote USDC for mint(positive) or burn(negative)
    // based on circulation and amount (and sign of amount)
    function quoteUSDC(uint256 _amount) public view returns (uint256) {
        // Basic integral
        uint256 supply = totalSupply();
        uint256 supply2 = supply*supply;  // Supply squared
        uint256 supplyAfterTx = supply + _amount; // post-mint supply        
        uint256 supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
        uint256 squareDiff = supplyAfterTx2 - supply2;
        uint256 scaledSquareDiff = squareDiff * USDCscaleFactor;
        uint256 amountInUSDCin6dec = scaledSquareDiff / curveFactor;
        uint256 stubble = amountInUSDCin6dec % 10000; // shave to USDC cents
        return amountInUSDCin6dec - stubble;
    }

    // Return address discount level as an uint8 as a function of balance.
    function discountLevel(address _whom) public view returns(uint8) {
        uint256 userBalance = balanceOf(_whom); // lookup once.  
        console.log('userBalance:', userBalance);     
        //console.log('levelAntes.length:', levelAntes.length);  
        uint8 currentLevel = 0;
        for (uint8 index = 0; index < levelAntes.length ; index++){ // TODO: fix, last level is wrong
            if (userBalance >= levelAntes[index]) {
                currentLevel++;
            }

            /*
            console.log('currentLevel inside loop:', currentLevel);
            if (currentLevel == levelAntes.length-1) {
                //console.log('currentLevel reached 4');
                //break; // TODO: check if okay now
                //console.log('currentLevel returned:', currentLevel);
                return currentLevel+1;
            }*/
        }   
        console.log('currentLevel returned:', currentLevel);
        return currentLevel;
    }

    // Quote % fee the given user will be charged based on their
    // current balance, Tx amount, and contents of the discount lookup table.
    // Returns a percentage * 10,000.
    function quoteFeePercentage(address forWhom)
        public
        view
        returns (uint16)
    {   
        console.log("discountLevel(forWhom):", discountLevel(forWhom));        
        //console.log("levelDiscounts[discountLevel(forWhom):", levelDiscounts[ 0 ]  ); // TODO: fix, throws
        //uint8 _discountLevel = discountLevel(forWhom);
        //uint8 _diff = uint8(100) - _discountLevel;
        //uint16 _diff16 = uint16(_diff); 
         console.log("uint16(100*baseFee):", uint16(100*baseFee)); 
          console.log("uint16(uint8(100)-levelDiscounts[discountLevel(forWhom)]):", uint16(uint8(100)-levelDiscounts[discountLevel(forWhom)])); 
        return uint16(100*baseFee)*uint16(uint8(100)-levelDiscounts[discountLevel(forWhom)]); // 10,000x % // TODO: fix, dummy response atm //return 10000;//
    }

    // Execute mint (positive amount) or burn (negative amount).
    function changeSupply(address _forWhom, uint256 _amountBNJI) internal nonReentrant {
        // Calculate change
        uint256 principleInUSDCin6dec = quoteUSDC(_amountBNJI); // negative on burn
        console.log('principleInUSDCin6dec:', principleInUSDCin6dec);
        uint256 fee = principleInUSDCin6dec * uint256(quoteFeePercentage(msg.sender))/ 1000000; // always positive
        uint256 feeRoundedDownIn6dec = fee - (fee % 10000);
        console.log('feeRoundedDownIn6dec:', feeRoundedDownIn6dec);
        uint256 endAmountInUSDCin6dec = principleInUSDCin6dec + feeRoundedDownIn6dec; // negative on burn
        console.log('endAmountInUSDCin6dec:', endAmountInUSDCin6dec);

        // Execute exchange
        if (_amountBNJI > 0) {
            // minting
            moveUSDC(msg.sender, _forWhom, endAmountInUSDCin6dec);
            _mint(_forWhom, _amountBNJI);
        } else {
            // burning
            _burn(msg.sender, _amountBNJI);
            moveUSDC(msg.sender, _forWhom, principleInUSDCin6dec);            
        }

        // Record change.
        reserveInUSDCin6dec += principleInUSDCin6dec; // TODO: check if uint256 is correct here for principle, should not be negative on burn?
        emit exchanged(msg.sender, _forWhom, _amountBNJI, endAmountInUSDCin6dec, fee);
    }

    // Move USDC for a supply change.  Note: sign of amount is the mint/burn direction.
    function moveUSDC(
        address _payer, 
        address _payee, 
        uint256 _amountUSDCin6dec // negative when burning, does not include fee. positive when minting, includes fee.
    ) internal {
        if (_amountUSDCin6dec > 0) {         
            console.log('_payer:', _payer);
            console.log('_amountUSDCin6dec:', _amountUSDCin6dec);
            console.log('polygonUSDC.allowance(_payer, address(this)):', polygonUSDC.allowance(_payer, address(this)));   
            // pull USDC from user (_payer), push to this contract           
            polygonUSDC.transferFrom(_payer, address(this), _amountUSDCin6dec);             
            // this contract gives the Aave lending pool allowance to pull in _amount of USDC (in 6 decimals unit) from this contract 
            polygonUSDC.approve(address(polygonLendingPool), _amountUSDCin6dec); // TODO: check if this is coming in formatted in 6 decimal units, i.e. USDC * 1000000 or cents * 10000
            // lending pool is queried to pull in the approved USDC (in 6 decimals unit)  
            polygonLendingPool.deposit(address(polygonUSDC), _amountUSDCin6dec, address(this), 0); // TODO: also needs 6 decimals format
            emit LendingPoolDeposit(_amountUSDCin6dec, _payer);
        } else {                     
            // lending pool is queried to push USDC (in 6 decimals unit) without fee back to this contract
            polygonLendingPool.withdraw(address(polygonUSDC), _amountUSDCin6dec, address(this)); // TODO: also needs 6 decimals format
            emit LendingPoolWithdrawal(_amountUSDCin6dec, _payee);
            // take USDC from this contract, push to user (_payee)
            polygonUSDC.transfer(_payee, _amountUSDCin6dec);            
        }
    }   

    // Only reset last upgrade block height if its a new hold.
    function adjustUpgradeTimeouts(address _toWhom) internal returns (bool) {
        uint256 blockNum = block.number;
        uint256 timeSinceLastHoldStart = blockNum - lastUpgradeBlockHeight[_toWhom];
        uint256 levelNow = levelHolds[discountLevel(_toWhom)];
        if (levelNow != 0){
            levelNow = levelHolds[discountLevel(_toWhom)-1];
        }
        int256 timeSinceLastHoldEnd = int256(timeSinceLastHoldStart) - int256(levelNow); // TODO: fix: could come out negative in total (underflow) or discountLevel(_toWhom)-1 could be negative?
        if (timeSinceLastHoldEnd > 0) {
            lastUpgradeBlockHeight[_toWhom] = blockNum; 
        }
    }      

    // Absolute value function needed to make fee work for burn
    function abs(int x) private pure returns (int) {
        return x >= 0 ? x : -x;
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

    function updatePolygonUSDC(address newAddress) public onlyOwner {    
    polygonUSDC = IERC20(newAddress);
    }

    function updatePolygonAMUSDC(address newAddress) public onlyOwner {   
        polygonAMUSDC = IERC20(newAddress); 
    } 

    function updateApproveLendingPool (uint256 amountToApprove) public onlyOwner {   
        polygonUSDC.approve(address(polygonLendingPool), amountToApprove);       
    }

    function updateLevelAntes (uint32[] memory newLevelAntes) public onlyOwner {
        levelAntes = newLevelAntes;
    }

    function updateLevelHolds (uint16[] memory newLevelHolds) public onlyOwner {
        levelHolds = newLevelHolds;
    }

    function updateLevelDiscounts (uint8[] memory newLevelDiscounts) public onlyOwner {
        levelDiscounts = newLevelDiscounts;
    }  

    function updateBlocksPerDay (uint256 newAmountOfBlocksPerDay) public onlyOwner {
        blocksPerDay = newAmountOfBlocksPerDay;
    }    
}