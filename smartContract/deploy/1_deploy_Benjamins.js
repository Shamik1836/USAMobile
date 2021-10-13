const CONTRACT_NAME = "MumbaiBenjamins";  // CHANGED FOR MUMBAI XXXXX

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer, feeReceiverAddress } = await getNamedAccounts();

  console.log("Deploying now with the acc:", deployer); 

  await deploy("MumbaiBenjamins", {   // CHANGED FOR MUMBAI XXXXX
    from: deployer,
    args: [feeReceiverAddress],
    log: true,      
  });
};

module.exports.tags = [CONTRACT_NAME];