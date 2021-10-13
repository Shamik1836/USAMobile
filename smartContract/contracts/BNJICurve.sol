//SPDX-License-Identifier: NONE

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract BNJICurve is Ownable, Pausable{   

  uint256 USDCscale = 10**6;  

  uint256 curveFactor = 800000;

  function calcPriceForTokenMint(
    uint256 supply,    
    uint256 tokensToMint) public view returns (uint256)
  { 
    require(tokensToMint > 0, "BNJICurve: Must mint more than 0 tokens");  
    
    uint256 supplySquared = supply*supply;    

    uint256 supplyAfterMint = supply + tokensToMint;    
    uint256 supplyAfterMintSquared = supplyAfterMint * supplyAfterMint; 

    uint256 step1 = supplyAfterMintSquared - supplySquared; 
    
    uint256 step2 = step1 * USDCscale;
   
    uint256 totalPriceForTokensMintingNowInUSDC6digits = step2 / curveFactor;  
        
    uint256 takeOffFactor = 10 ** 4;
    
    uint256 rest = totalPriceForTokensMintingNowInUSDC6digits % takeOffFactor;
    
    uint256 mintResultWithCentsroundedDown = totalPriceForTokensMintingNowInUSDC6digits - rest;
    
    // returning price for specified token amount
    return mintResultWithCentsroundedDown;        
  }

  function calcReturnForTokenBurn(
    uint256 supply,    
    uint256 tokensToBurn) public view returns (uint256)
  {
    // validate input
    
    require(supply > 0 && tokensToBurn > 0 && supply >= tokensToBurn, "BNJICurve: Sending args must be larger than 0");   
    
    uint256 supplyAfterBurn = supply - tokensToBurn; 

    uint256 supplySquared = supply * supply; 
    uint256 supplyAfterBurnSquared = supplyAfterBurn * supplyAfterBurn;
    
    uint256 step1 = supplySquared - supplyAfterBurnSquared;    
   
    uint256 step2 = step1 * USDCscale ;
    
    uint256 returnForTokenBurnInUSDC6digits = step2/ 800000 ;
    
    uint256 takeOffFactor = 10 ** 4;
   
    uint256 rest = returnForTokenBurnInUSDC6digits % takeOffFactor;
   
    uint256 burnResultWithCentsroundedDown = returnForTokenBurnInUSDC6digits - rest;    

    return burnResultWithCentsroundedDown;    
  }
  
  // function for owner to withdraw any ERC20 token that has accumulated
  function updateCurveFactor (uint256 newCurveFactor) public onlyOwner {
    curveFactor = newCurveFactor;
  }

  // function for owner to withdraw any ERC20 token that has accumulated
  function withdrawERC20 (address ERC20ContractAddress, uint256 amount) public onlyOwner {
    IERC20 ERC20Instance = IERC20(ERC20ContractAddress);        
    ERC20Instance.transfer(msg.sender, amount);         
  }

  // pausing funcionality from OpenZeppelin's Pausable
  function pause() public onlyOwner {
    _pause();
  }

  // unpausing funcionality from OpenZeppelin's Pausable
  function unpause() public onlyOwner {
    _unpause();
  }

}