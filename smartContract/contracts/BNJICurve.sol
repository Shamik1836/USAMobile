pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
* @title
*
* 
*/
contract BNJICurve is Ownable, Pausable{   

  uint256 _USDCscale = 10**18;  

  function calcPriceForTokenMint(
    uint256 _supply,    
    uint256 _tokensToMint) public view returns (uint256)
  { 
    // validate input
    require(_tokensToMint > 0, "BNJICurve: Must mint more than 0 tokens");  

    //console.log(_tokensToMint, '_tokensToMint in BCRV, calcPriceForTokenMint');  
    //console.log(_supply, ' _supply in BCRV, calcPriceForTokenMint');   
    
    uint256 _supplySquared = _supply*_supply;
    //console.log(_supplySquared, ' _supplySquared in BCRV, calcPriceForTokenMint');    

    uint256 _supplyAfterMint = _supply + _tokensToMint;    
    uint256 _supplyAfterMintSquared = _supplyAfterMint * _supplyAfterMint; 

    uint256 _step1 = _supplyAfterMintSquared - _supplySquared; 
    //console.log(_step1, '_step1 in BCRV, calcPriceForTokenMint');

    uint256 _step2 = _step1 * _USDCscale;
    //console.log(_step2, '_step2 in BCRV, calcPriceForTokenMint');

    uint256 _totalPriceForTokensMintingNowInUSDC_WEI = _step2 / 800000;  
    //console.log(_totalPriceForTokensMintingNowInUSDC_WEI, '_totalPriceForTokensMintingNowInUSDC_WEI in BCRV, calcPriceForTokenMint');
    
    uint256 takeOffFactor = 10 ** 16;
    //console.log(takeOffFactor, 'takeOff in BCRV, calcPriceForTokenMint');

    uint256 rest = _totalPriceForTokensMintingNowInUSDC_WEI % takeOffFactor;
    //console.log(rest, 'rest in BCRV, calcPriceForTokenMint');

    uint256 mintResultWithCentsroundedDown = _totalPriceForTokensMintingNowInUSDC_WEI - rest;
    //console.log(mintResultWithCentsroundedDown, 'mintResultWithCentsroundedDown in BCRV, calcPriceForTokenMint');

    // returning price for specified token amount
    return mintResultWithCentsroundedDown;        
  }

  /*
   * @dev given Benjamins supply and a sell amount (in Benjamins),
   * calculates the return for a given conversion (at the moment in ETH, in the future in a stable coin)
   *
   * Burn Formula:
   * _supplyAfterBurn = _supply - _tokensToBurn;     
   * Return = ( (_supply * _supply) - (_supplyAfterBurn * _supplyAfterBurn) ) / 800000;
   *
   * @param _supply              Benjamins total supply 
   * @param _tokensToBurn          sell amount, in Benjamins
   *
   * @return price in USDC_WEI
  */
  function calcReturnForTokenBurn(
    uint256 _supply,    
    uint256 _tokensToBurn) public view returns (uint256)
  {
    // validate input
    
    require(_supply > 0 && _tokensToBurn > 0 && _supply >= _tokensToBurn, "BNJICurve: Sending args must be larger than 0");   
    
    uint256 _supplyAfterBurn = _supply - _tokensToBurn; 

    uint256 _supplySquared = _supply * _supply; 
    uint256 _supplyAfterBurnSquared = _supplyAfterBurn * _supplyAfterBurn;
    /*
    console.log('BCRV, calcReturnForTokenBurn: _supply', _supply);
    console.log('BCRV, calcReturnForTokenBurn: _tokensToBurn', _tokensToBurn);
    console.log('BCRV, calcReturnForTokenBurn: _supplyAfterBurn', _supplyAfterBurn);

    console.log('BCRV, calcReturnForTokenBurn: _supplySquared', _supplySquared);
    console.log('BCRV, calcReturnForTokenBurn: _supplyAfterBurnSquared', _supplyAfterBurnSquared);
    */
    uint256 _step1 = _supplySquared - _supplyAfterBurnSquared;    
    //console.log('BCRV, calcReturnForTokenBurn: _step1', _step1);    

    uint256 _step2 = _step1 * _USDCscale ;
    //console.log('BCRV, calcReturnForTokenBurn: _step2', _step2);

    uint256 _returnForTokenBurnInUSDC_WEI = _step2/ 800000 ;
    //console.log('BCRV, calcReturnForTokenBurn: _result', _result);

    uint256 takeOffFactor = 10 ** 16;
    //console.log(takeOffFactor, 'takeOff in BCRV, calcReturnForTokenBurn');

    uint256 rest = _returnForTokenBurnInUSDC_WEI % takeOffFactor;
    //console.log(rest, 'rest in BCRV, calcPriceForTokenMint');

    uint256 burnResultWithCentsroundedDown = _returnForTokenBurnInUSDC_WEI - rest;
    //console.log(burnResultWithCentsroundedDown, 'burnResultWithCentsroundedDown in BCRV, calcReturnForTokenBurn');

    return burnResultWithCentsroundedDown ;
    
  }
  
  // function for owner to withdraw any ERC20 token that has accumulated
  function withdrawERC20 (address ERC20ContractAddress) public onlyOwner {
    IERC20 ERC20Instance = IERC20(ERC20ContractAddress);    
    uint256 accumulatedTokens = ERC20Instance.balanceOf(address(this));
    ERC20Instance.transfer(_msgSender(), accumulatedTokens);         
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