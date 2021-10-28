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
    uint32[] levelAntes;          // how many BNJI needed for each level;
    uint16[] levelHolds;          // how many blocks to hold is necessary before withdraw is unlocked, at each level;    
    uint8[] levelDiscounts;       // percentage discount given by each level;
    uint8 antiFlashLoan = 10;     // number of blocks hold to defend vs. flash loans.
    uint blocksPerDay = 2;        // amount of blocks minted per day on polygon mainnet // TODO: change to 43200, value now is for testing
    uint256 curveFactor = 800000; // Inverse slope of the bonding curve.
    uint8 baseFee = 1;            // in percent as an integer  // TODO: change to real value, this is for testing

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
        levelHolds =     [ 0,  2,  7,  30,  90,  360]; // in days
        levelDiscounts = [ 0,  5, 10,  20,  40,   75]; // in percent*100, forced type
                
        pause(); 
    }

    event newDepositAccount(address account);
    event newFeeReceiver(address beneficiary);
    event exchanged(
        address fromAddress,
        address toAddress,
        uint256 inTokens,
        uint256 beforeFeeUSDCin6dec,
        uint256 feeUSDCin6dec
    );
    event profitTaken(uint256 availableIn6dec, uint256 amountUSDCin6dec);
    event LendingPoolDeposit (uint256 amountUSDCin6dec, address payer);  
    event LendingPoolWithdrawal (uint256 amountUSDCBeforeFeein6dec, address payee);

    // owner overrides paused.
    modifier whenAvailable() {        
        require(!paused() || (_msgSender() == owner()), "Benjamins is paused.");
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
       //console.log('holdTime calculated:', holdTime);
       //console.log('holdTime necessary, i.e. blocksPerDay*levelHolds[discountLevel(userToCheck)]:', blocksPerDay*levelHolds[discountLevel(userToCheck)]);
        require(holdTime > antiFlashLoan, 
            'Anti-flashloan withdraw timeout in effect.');
        require(holdTime >  blocksPerDay*levelHolds[discountLevel(userToCheck)], 
            'Discount level withdraw timeout in effect.');
        _;
    }
 
    // Redundant reserveInUSDC protection vs. user withdraws.
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

    // OZ recommends overriding this vs. setting it.
    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function calcTransportFee(uint256 amountOfBNJI) internal view returns (uint256) {
        uint256 beforeFeeInUSDCin6dec = quoteUSDC(amountOfBNJI, false);                
        console.log(beforeFeeInUSDCin6dec, 'beforeFeeInUSDCin6dec, calcTransportFee, BNJ');
        uint256 fee = beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender))/ 1000000; 
        uint256 feeRoundedDownIn6dec = fee - (fee % 10000);
        console.log(feeRoundedDownIn6dec, 'feeRoundedDownIn6dec, calcTransportFee, BNJ'); 
        return feeRoundedDownIn6dec;
    }
    
    // modified ERC20 transfer() // TODO: use msg.sender or _msgSender() ?
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
        
        // pull USDC from user (_msgSender()), push to feeReceiver           
        polygonUSDC.transferFrom(_msgSender(), feeReceiver, transportFeeRoundedIn6dec); // TODO: verify this call works as intended 

        // transferring BNJIs
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
    function transferFrom(address sender, address recipient, uint256 amountBNJIs) 
        public 
        override 
        nonReentrant
        whenAvailable 
        withdrawAllowed(sender)        
    returns (bool) {
        //checking recipient's discount level before transfer
        uint8 originalUserDiscountLevel = discountLevel(recipient); 

        uint256 transportFeeRoundedIn6dec = calcTransportFee(amountBNJIs);

        // pull USDC from user (sender), push to feeReceiver           
        polygonUSDC.transferFrom(sender, feeReceiver, transportFeeRoundedIn6dec); // TODO: verify this call works as intended 

        // checking if allowance for BNJIs is enough
        uint256 currentBNJIAllowance = allowance(sender, _msgSender());  
        require(currentBNJIAllowance >= amountBNJIs, "Benjamins: transfer amount exceeds allowance");      

        // transferring BNJIs
        _transfer (sender, recipient, amountBNJIs); 

        // decreasing BNJI allowance by transferred amount
        _approve(sender, _msgSender(), currentBNJIAllowance - amountBNJIs);   
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
        uint8 originalUserDiscountLevel = discountLevel(_toWhom);
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

    // Quote USDC for mint(positive) or burn(negative)
    // based on circulation and amount (and sign of amount)
    function quoteUSDC(uint256 _amount, bool isMint) public view whenAvailable returns (uint256) {       
        // Basic integral
        uint256 supply = totalSupply();
        uint256 supply2 = supply*supply;  // Supply squared
        uint256 supplyAfterTx;
        uint256 supplyAfterTx2;
        uint256 squareDiff;
        if (isMint==true){
            supplyAfterTx = supply + _amount; // post-mint supply on mint
            supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
            squareDiff = supplyAfterTx2 - supply2;
        } else {
            supplyAfterTx = supply - _amount; // post-mint supply on burn
            supplyAfterTx2 = supplyAfterTx*supplyAfterTx;
            squareDiff = supply2 - supplyAfterTx2;
        }            
        uint256 scaledSquareDiff = squareDiff * USDCscaleFactor;
        uint256 amountInUSDCin6dec = scaledSquareDiff / curveFactor;
        uint256 stubble = amountInUSDCin6dec % 10000; // shave to USDC cents
        uint256 endAmountUSDCin6dec = amountInUSDCin6dec - stubble;
        require (endAmountUSDCin6dec >= 5000000, "BNJ, quoteUSDC: Minimum BNJI value to move is $5 USDC" );
        return endAmountUSDCin6dec;
    }

    // Return address discount level as an uint8 as a function of balance.
    function discountLevel(address _whom) public view whenAvailable returns(uint8) {
        uint256 userBalance = balanceOf(_whom); // lookup once.  
        //console.log('userBalance:', userBalance);     
        //console.log('levelAntes.length:', levelAntes.length);  
        uint8 currentLevel = 0;
        for (uint8 index = 0; index < levelAntes.length ; index++){ // TODO: fix, last level is wrong
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
        return uint16(100*baseFee)*uint16(uint8(100)-levelDiscounts[discountLevel(forWhom)]); // 10,000x % // 
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
        console.log(beforeFeeInUSDCin6dec, 'BNJ, beforeFeeInUSDCin6dec');
        uint256 fee = beforeFeeInUSDCin6dec * uint256(quoteFeePercentage(msg.sender))/ 1000000; 
        uint256 feeRoundedDownIn6dec = fee - (fee % 10000);
        console.log(feeRoundedDownIn6dec, 'BNJ, feeRoundedDownIn6dec');      
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
            console.log(_afterFeeUSDCin6dec, 'BNJ, _afterFeeUSDCin6dec');    
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
            console.log(_afterFeeUSDCin6dec, 'BNJ, _afterFeeUSDCin6dec');                 
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