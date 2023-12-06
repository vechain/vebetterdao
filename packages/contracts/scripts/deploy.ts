import { artifacts, network } from "hardhat";

const B3TR = "B3TR"; // Declare a global variable for the contract name
const Contract = artifacts.require(B3TR);


async function main() {
  const deployedContract = await Contract.new();

  console.log(
    `${B3TR} deployed to ${deployedContract.address} on ${network.name}` // Use the global variable
  );

  // close the script
  process.exit(0);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
