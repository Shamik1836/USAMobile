pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDCToken is ERC20, Ownable{
  
  uint256 mockUSDCscale = 10**18;
  
  uint256 amountToGivePerCall = 20000 ;

  mapping (address => mapping (address => uint256)) private _allowances;

  constructor() ERC20("mockUSDCToken", "mUSDC"){
  }    

  // claim tokens by minting to _msgSender()
  function getmockUSDC() public{    
    // mint tokens, receiver, amount
    _mint(_msgSender(), (amountToGivePerCall * mockUSDCscale));    
  }
  
}