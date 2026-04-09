import { ethers } from "hardhat"

export const navigatorRegistryLibraries = async (logOutput = false) => {
  const deploy = async (name: string, libraries?: Record<string, string>) => {
    const Factory = await ethers.getContractFactory(name, libraries ? { libraries } : undefined)
    const lib = await Factory.deploy()
    await lib.waitForDeployment()
    logOutput && console.log(`${name} Library deployed`)
    return lib
  }

  // NavigatorDelegationUtils must be deployed first — StakingUtils and SlashingUtils depend on it
  const NavigatorDelegationUtils = await deploy("NavigatorDelegationUtils")
  const delegationAddr = await NavigatorDelegationUtils.getAddress()

  const NavigatorStakingUtils = await deploy("NavigatorStakingUtils", {
    "contracts/navigator/libraries/NavigatorDelegationUtils.sol:NavigatorDelegationUtils": delegationAddr,
  })
  const NavigatorSlashingUtils = await deploy("NavigatorSlashingUtils", {
    "contracts/navigator/libraries/NavigatorDelegationUtils.sol:NavigatorDelegationUtils": delegationAddr,
  })
  const NavigatorVotingUtils = await deploy("NavigatorVotingUtils")
  const NavigatorFeeUtils = await deploy("NavigatorFeeUtils")
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
