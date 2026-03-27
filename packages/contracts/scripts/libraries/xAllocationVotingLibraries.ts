import { ethers } from "hardhat"

export const xAllocationVotingLibraries = async (logOutput = false) => {
  const deploy = async (name: string) => {
    const Factory = await ethers.getContractFactory(name)
    const lib = await Factory.deploy()
    await lib.waitForDeployment()
    logOutput && console.log(`${name} Library deployed`)
    return lib
  }

  const AutoVotingLogic = await deploy("AutoVotingLogic")
  const ExternalContractsUtils = await deploy("ExternalContractsUtils")
  const VotingSettingsUtils = await deploy("VotingSettingsUtils")
  const VotesUtils = await deploy("VotesUtils")
  const VotesQuorumFractionUtils = await deploy("VotesQuorumFractionUtils")
  const RoundEarningsSettingsUtils = await deploy("RoundEarningsSettingsUtils")
  const RoundFinalizationUtils = await deploy("RoundFinalizationUtils")
  const RoundsStorageUtils = await deploy("RoundsStorageUtils")
  const FreshnessUtils = await deploy("FreshnessUtils")

  // RoundVotesCountingUtils depends on FreshnessUtils
  const RoundVotesCountingUtilsFactory = await ethers.getContractFactory("RoundVotesCountingUtils", {
    libraries: { FreshnessUtils: await FreshnessUtils.getAddress() },
  })
  const RoundVotesCountingUtils = await RoundVotesCountingUtilsFactory.deploy()
  await RoundVotesCountingUtils.waitForDeployment()
  logOutput && console.log("RoundVotesCountingUtils Library deployed")

  return {
    AutoVotingLogic,
    ExternalContractsUtils,
    VotingSettingsUtils,
    VotesUtils,
    VotesQuorumFractionUtils,
    RoundEarningsSettingsUtils,
    RoundFinalizationUtils,
    RoundsStorageUtils,
    RoundVotesCountingUtils,
    FreshnessUtils,
  }
}
