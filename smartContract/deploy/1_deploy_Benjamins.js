const CONTRACT_NAME = "Benjamins";

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer, feeReceiverAddress } = await getNamedAccounts();

  console.log("Deploying now with the acc:", deployer); 

  // Upgradeable Proxy
  await deploy("Benjamins", {
    from: deployer,
    args: [feeReceiverAddress],
    log: true,      
  });
};

module.exports.tags = [CONTRACT_NAME];