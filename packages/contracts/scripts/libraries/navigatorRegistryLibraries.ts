import { ethers } from "hardhat"

export const navigatorRegistryLibraries = async (logOutput = false) => {
  const deploy = async (name: string) => {
    const Factory = await ethers.getContractFactory(name)
    const lib = await Factory.deploy()
    await lib.waitForDeployment()
    logOutput && console.log(`${name} Library deployed`)
    return lib
  }

  const NavigatorStakingUtils = await deploy("NavigatorStakingUtils")
  const NavigatorDelegationUtils = await deploy("NavigatorDelegationUtils")
  const NavigatorVotingUtils = await deploy("NavigatorVotingUtils")
  const NavigatorFeeUtils = await deploy("NavigatorFeeUtils")
  const NavigatorSlashingUtils = await deploy("NavigatorSlashingUtils")
  const NavigatorLifecycleUtils = await deploy("NavigatorLifecycleUtils")

  return {
    NavigatorStakingUtils,
    NavigatorDelegationUtils,
    NavigatorVotingUtils,
    NavigatorFeeUtils,
    NavigatorSlashingUtils,
    NavigatorLifecycleUtils,
  }
}
