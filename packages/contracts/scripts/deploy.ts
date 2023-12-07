import { artifacts, ethers, network } from "hardhat";
import hre from "hardhat";

const DEFAULT_OPERATOR = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"

async function main() {
  console.log(`Deploying contracts on ${network.name}...`);

  const B3TRContract = await hre.ethers.getContractFactory("B3TR")
  const contract = await B3TRContract.deploy(DEFAULT_OPERATOR);
  await contract.waitForDeployment()

  console.log(
    `B3TR contract deployed at address ${await contract.getAddress()}`
  );

  // close the script
  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
