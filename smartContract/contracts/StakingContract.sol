pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingContract is Ownable, Pausable{

  address private _operator;


  address[] stakers;

  mapping (address => stake) public stakingPositions;

  struct stake {
    address stakingAddress;
    uint256 amount;
    uint256 stakingTimestamp; 
  }

  event OperatorRoleTransferred(address oldOperator, address newOperator);

  constructor () {
    _setOperator(_msgSender());
  }

  function operator() public view virtual returns (address) {
    return _operator;
  }

  modifier onlyOperator() {
    require(operator() == _msgSender(), "StakingContract: caller is not the operator");
    _;
  }
  
  function setOperator(address newOperator) public onlyOwner {
    _setOperator(newOperator);
  }

  function _setOperator(address newOperator) private onlyOwner {
    address oldOperator = _operator;
    _operator = newOperator;
    emit OperatorRoleTransferred(oldOperator, newOperator);
  }

  function depositStake() public onlyOperator{
    console.log('depositStake called successfully');
  }

  function withdrawStake() public onlyOperator{
    console.log('withdrawStake called successfully');
  }




}
