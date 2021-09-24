// SPDX-License-Identifier: Apache License, Version 2.0

pragma solidity ^0.8.0;

import "hardhat/console.sol";
 
/**
* @title
*
* Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements;
* and to You under the Apache License, Version 2.0. "
*/
contract OurCurve {   

  uint256 mockUSDCscale = 10**18;  

  function calcPriceForTokenMint(
    uint256 _supply,    
    uint256 _tokensToMint) public view returns (uint256)
  { 
    // validate input
    require(_tokensToMint > 0, "OurCurve: Must mint more than 0 tokens");  

    //console.log(_tokensToMint, '_tokensToMint in OC, calcPriceForTokenMint');  
    console.log(_supply, ' _supply in OC, calcPriceForTokenMint');   
    
    uint256 _supplySquared = _supply*_supply;
    //console.log(_supplySquared, ' _supplySquared in OC, calcPriceForTokenMint');    

    uint256 _supplyAfterMint = _supply + _tokensToMint;    
    uint256 _supplyAfterMintSquared = _supplyAfterMint * _supplyAfterMint; 

    uint256 _step1 = _supplyAfterMintSquared - _supplySquared; 
    //console.log(_step1, '_step1 in OC, calcPriceForTokenMint');

    uint256 _step2 = _step1 * mockUSDCscale;
    //console.log(_step2, '_step2 in OC, calcPriceForTokenMint');

    uint256 _totalPriceForTokensMintingNowInMockUSDC_WEI = _step2 / 800000;  
    //console.log(_totalPriceForTokensMintingNowInMockUSDC_WEI, '_totalPriceForTokensMintingNowInMockUSDC_WEI in OC, calcPriceForTokenMint');
    
    uint256 takeOffFactor = 10 ** 16;
    //console.log(takeOffFactor, 'takeOff in OC, calcPriceForTokenMint');

    uint256 rest = _totalPriceForTokensMintingNowInMockUSDC_WEI % takeOffFactor;
    //console.log(rest, 'rest in OC, calcPriceForTokenMint');

    uint256 mintResultWithCentsroundedDown = _totalPriceForTokensMintingNowInMockUSDC_WEI - rest;
    //console.log(mintResultWithCentsroundedDown, 'mintResultWithCentsroundedDown in OC, calcPriceForTokenMint');

    // returning price for specified token amount
    return mintResultWithCentsroundedDown;        
  }

  /*
   * @dev given OurToken supply and a sell amount (in OurToken),
   * calculates the return for a given conversion (at the moment in ETH, in the future in a stable coin)
   *
   * Burn Formula:
   * _supplyAfterBurn = _supply - _tokensToBurn;     
   * Return = ( (_supply * _supply) - (_supplyAfterBurn * _supplyAfterBurn) ) / 800000;
   *
   * @param _supply              OurToken total supply 
   * @param _tokensToBurn          sell amount, in OurToken
   *
   * @return price in mockUSDC_WEI
  */
  function calcReturnForTokenBurn(
    uint256 _supply,    
    uint256 _tokensToBurn) public view returns (uint256)
  {
    // validate input
    
    require(_supply > 0 && _tokensToBurn > 0 && _supply >= _tokensToBurn, "OurCurve: Sending args must be larger than 0");   
    
    uint256 _supplyAfterBurn = _supply - _tokensToBurn; 

    uint256 _supplySquared = _supply * _supply; 
    uint256 _supplyAfterBurnSquared = _supplyAfterBurn * _supplyAfterBurn;
    /*
    console.log('OC, calcReturnForTokenBurn: _supply', _supply);
    console.log('OC, calcReturnForTokenBurn: _tokensToBurn', _tokensToBurn);
    console.log('OC, calcReturnForTokenBurn: _supplyAfterBurn', _supplyAfterBurn);

    console.log('OC, calcReturnForTokenBurn: _supplySquared', _supplySquared);
    console.log('OC, calcReturnForTokenBurn: _supplyAfterBurnSquared', _supplyAfterBurnSquared);
    */
    uint256 _step1 = _supplySquared - _supplyAfterBurnSquared;    
    //console.log('OC, calcReturnForTokenBurn: _step1', _step1);    

    uint256 _step2 = _step1 * mockUSDCscale ;
    //console.log('OC, calcReturnForTokenBurn: _step2', _step2);

    uint256 _returnForTokenBurnInMockUSDC_WEI = _step2/ 800000 ;
    //console.log('OC, calcReturnForTokenBurn: _result', _result);

    uint256 takeOffFactor = 10 ** 16;
    //console.log(takeOffFactor, 'takeOff in OC, calcReturnForTokenBurn');

    uint256 rest = _returnForTokenBurnInMockUSDC_WEI % takeOffFactor;
    //console.log(rest, 'rest in OC, calcPriceForTokenMint');

    uint256 burnResultWithCentsroundedDown = _returnForTokenBurnInMockUSDC_WEI - rest;
    //console.log(burnResultWithCentsroundedDown, 'burnResultWithCentsroundedDown in OC, calcReturnForTokenBurn');

    return burnResultWithCentsroundedDown ;
    
  }
  

}