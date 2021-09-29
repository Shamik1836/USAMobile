

pragma solidity ^0.8.0;
interface IStakingContract {

  event OperatorRoleTransferred(address oldOperator, address newOperator);


  function depositStake() external;

  function withdrawStake() external;





}