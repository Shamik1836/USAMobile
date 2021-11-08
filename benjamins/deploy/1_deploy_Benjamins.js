const CONTRACT_NAME = "Benjamins"; 

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer, feeReceiverAddress, testUser_1, testUser_2, testUser_3, testUser_4, testUser_5 } = await getNamedAccounts();

  console.log("Deploying now with the acc:", deployer); 

  await deploy("Benjamins", {   
    from: deployer,
    args: [],
    log: true,      
  });
};

module.exports.tags = [CONTRACT_NAME];