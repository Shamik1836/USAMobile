// requires ethers.js: https://docs.ethers.io/v5/
function bigNumberToNumber(bignumber) {
  let convertedNumber = (ethers.utils.formatUnits(bignumber, 0)).toString();  
  return convertedNumber;
}
const benjaminsContract = await ethers.getContract("Benjamins"); 

// taking the amounts of levels to buy from the user
const amountOfLevelsPurchased = incomingUserCall;

const tokensExistAtStart = bigNumberToNumber(await benjaminsContract.totalSupply());
const tokensMintingNow = amountOfLevelsPurchased*20;
const tokensExistAtEnd = Number(tokensExistAtStart) + Number(tokensMintingNow);

// starting with minting costs, then rounding down to cents
const mintingCostinUSDC = ((tokensExistAtEnd * tokensExistAtEnd) - (tokensExistAtStart * tokensExistAtStart)) / 800000;
const mintingCostInCents = mintingCostinUSDC * 100;
const mintingCostInCentsRoundedDown = mintingCostInCents - (mintingCostInCents % 1);

// getting accounts' feeModifier and starting with calculated fee, then rounding down to cents
const feeModifier = bigNumberToNumber(await benjaminsContract.findUsersFeeModifier()); 
const mintFeeStarterInCents = ((mintingCostInCents * feeModifier) /100) / 100;
const mintFeeInCentsRoundedDown = mintFeeStarterInCents - (mintFeeStarterInCents % 1);

// results, toPayTotalInUSDC can be displayed to user
const toPayTotalInCents = mintingCostInCentsRoundedDown + mintFeeInCentsRoundedDown;
const toPayTotalInUSDC = toPayTotalInCents / 100;
const toPayTotalIn6dec = toPayTotalInCents * 10000;

// call for user to approve this amount, expressed in 6 decimals
const toApproveIn6dec = toPayTotalIn6dec;
await polygonUSDC.approve(benjaminsContract.address, toApproveIn6dec);

// check if everything went right. 
const wasApprovedIn6dec = bigNumberToNumber (await polygonUSDC.allowance(userAddress, benjaminsContract.address));

// CHECK: wasApprovedIn6dec MUST be equal to toApproveIn6dec !