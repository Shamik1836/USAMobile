pragma solidity ^0.8.0;
//SPDX-License-Identifier: NONE
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


contract PolygonSimContract is ERC20 { 

  mapping (address => uint256) private simStakingPosCounterEach20;

  mapping (address => uint256) private simTokensCounter;

  constructor() ERC20("SimTokens", "SIMT") {

  }

  function checkAccountsBalance(address userToCheck) public view returns (uint256 balance) {
    return simTokensCounter[userToCheck];
  }



  function buyLevels(uint256 amountOfLevels) public {    

    uint256 simulatedTokensAmount = amountOfLevels * 20;
    _mint(address(this), simulatedTokensAmount);

    simTokensCounter[msg.sender] += simulatedTokensAmount;
    simStakingPosCounterEach20[msg.sender] += amountOfLevels;
  }

  function sellLevels(uint256 amountOfLevels) public {
    uint256 simulatedTokensAmount = amountOfLevels * 20;
    _burn(address(this), simulatedTokensAmount);

    simTokensCounter[msg.sender] -= simulatedTokensAmount;
    simStakingPosCounterEach20[msg.sender] -= amountOfLevels;
  }

  function checkAccountsFeeModifier(address userToCheck) public view returns (uint256 feeModifier) {

    uint256 usersStakedBalance = simTokensCounter[userToCheck];
    
    if (usersStakedBalance < 20) {
      return 100;
    }
    else if (usersStakedBalance >= 20 && usersStakedBalance < 40 ) {
      return 95;
    }    
    else if (usersStakedBalance >= 40 && usersStakedBalance < 60) {
      return 85;
    }
    else if (usersStakedBalance >= 60 && usersStakedBalance < 80) {
      return 70;
    }  
    else if (usersStakedBalance >= 80 && usersStakedBalance < 100) {
      return 50;
    } 
    else if (usersStakedBalance >= 100 ) {
      return 25;
    } 

    
  }

}