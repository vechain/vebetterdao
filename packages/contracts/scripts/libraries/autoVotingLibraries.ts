import { ethers } from "hardhat"

export const autoVotingLibraries = async () => {
  const AutoVotingLogicV8Factory = await ethers.getContractFactory("AutoVotingLogicV8")
  const AutoVotingLogic = await AutoVotingLogicV8Factory.deploy()
  await AutoVotingLogic.waitForDeployment()

  return {
    AutoVotingLogic,
  }
}
