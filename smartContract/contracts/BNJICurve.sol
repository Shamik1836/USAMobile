pragma solidity ^0.8.0;

import "hardhat/console.sol";
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
    // validate input
    require(tokensToMint > 0, "BNJICurve: Must mint more than 0 tokens");  

    //console.log(tokensToMint, 'tokensToMint in BCRV, calcPriceForTokenMint');  
    //console.log(supply, ' supply in BCRV, calcPriceForTokenMint');   
    
    uint256 supplySquared = supply*supply;
    //console.log(supplySquared, ' supplySquared in BCRV, calcPriceForTokenMint');    

    uint256 supplyAfterMint = supply + tokensToMint;    
    uint256 supplyAfterMintSquared = supplyAfterMint * supplyAfterMint; 

    uint256 step1 = supplyAfterMintSquared - supplySquared; 
    //console.log(step1, 'step1 in BCRV, calcPriceForTokenMint');

    uint256 step2 = step1 * USDCscale;
    //console.log(step2, 'step2 in BCRV, calcPriceForTokenMint');

    uint256 totalPriceForTokensMintingNowInUSDC6digits = step2 / curveFactor;  
    //console.log(totalPriceForTokensMintingNowInUSDC6digits, 'totalPriceForTokensMintingNowInUSDC6digits in BCRV, calcPriceForTokenMint');
    
    uint256 takeOffFactor = 10 ** 4;
    //console.log(takeOffFactor, 'takeOff in BCRV, calcPriceForTokenMint');

    uint256 rest = totalPriceForTokensMintingNowInUSDC6digits % takeOffFactor;
    //console.log(rest, 'rest in BCRV, calcPriceForTokenMint');

    uint256 mintResultWithCentsroundedDown = totalPriceForTokensMintingNowInUSDC6digits - rest;
    //console.log(mintResultWithCentsroundedDown, 'mintResultWithCentsroundedDown in BCRV, calcPriceForTokenMint');

    // returning price for specified token amount
    return mintResultWithCentsroundedDown;        
  }

  /*
   * @dev given Benjamins supply and a sell amount (in Benjamins),
   * calculates the return for a given conversion (at the moment in ETH, in the future in a stable coin)
   *
   * Burn Formula:
   * supplyAfterBurn = supply - tokensToBurn;     
   * Return = ( (supply * supply) - (supplyAfterBurn * supplyAfterBurn) ) / 800000;
   *
   * @param supply              Benjamins total supply 
   * @param tokensToBurn          sell amount, in Benjamins
   *
   * @return price in USDC6digits
  */
  function calcReturnForTokenBurn(
    uint256 supply,    
    uint256 tokensToBurn) public view returns (uint256)
  {
    // validate input
    
    require(supply > 0 && tokensToBurn > 0 && supply >= tokensToBurn, "BNJICurve: Sending args must be larger than 0");   
    
    uint256 supplyAfterBurn = supply - tokensToBurn; 

    uint256 supplySquared = supply * supply; 
    uint256 supplyAfterBurnSquared = supplyAfterBurn * supplyAfterBurn;
    /*
    //console.log('BCRV, calcReturnForTokenBurn: supply', supply);
    //console.log('BCRV, calcReturnForTokenBurn: tokensToBurn', tokensToBurn);
    //console.log('BCRV, calcReturnForTokenBurn: supplyAfterBurn', supplyAfterBurn);

    //console.log('BCRV, calcReturnForTokenBurn: supplySquared', supplySquared);
    //console.log('BCRV, calcReturnForTokenBurn: supplyAfterBurnSquared', supplyAfterBurnSquared);
    */
    uint256 step1 = supplySquared - supplyAfterBurnSquared;    
    //console.log('BCRV, calcReturnForTokenBurn: step1', step1);    

    uint256 step2 = step1 * USDCscale ;
    //console.log('BCRV, calcReturnForTokenBurn: step2', step2);

    uint256 returnForTokenBurnInUSDC6digits = step2/ 800000 ;
    //console.log('BCRV, calcReturnForTokenBurn: result', result);

    uint256 takeOffFactor = 10 ** 4;
    //console.log(takeOffFactor, 'takeOff in BCRV, calcReturnForTokenBurn');

    uint256 rest = returnForTokenBurnInUSDC6digits % takeOffFactor;
    //console.log(rest, 'rest in BCRV, calcPriceForTokenMint');

    uint256 burnResultWithCentsroundedDown = returnForTokenBurnInUSDC6digits - rest;
    //console.log(burnResultWithCentsroundedDown, 'burnResultWithCentsroundedDown in BCRV, calcReturnForTokenBurn');

    return burnResultWithCentsroundedDown ;
    
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