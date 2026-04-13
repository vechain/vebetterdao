import { ethers } from "hardhat"

export const navigatorRegistryLibraries = async (logOutput = false) => {
  const deploy = async (name: string, libraries?: Record<string, string>) => {
    const Factory = await ethers.getContractFactory(name, libraries ? { libraries } : undefined)
    const lib = await Factory.deploy()
    await lib.waitForDeployment()
    logOutput && console.log(`${name} Library deployed`)
    return lib
  }

  // LifecycleUtils must be deployed first — DelegationUtils depends on it
  const NavigatorLifecycleUtils = await deploy("NavigatorLifecycleUtils")
  const lifecycleAddr = await NavigatorLifecycleUtils.getAddress()

  // DelegationUtils depends on LifecycleUtils; StakingUtils and SlashingUtils depend on DelegationUtils
  const NavigatorDelegationUtils = await deploy("NavigatorDelegationUtils", {
    "contracts/navigator/libraries/NavigatorLifecycleUtils.sol:NavigatorLifecycleUtils": lifecycleAddr,
  })
  const delegationAddr = await NavigatorDelegationUtils.getAddress()

  const NavigatorStakingUtils = await deploy("NavigatorStakingUtils", {
    "contracts/navigator/libraries/NavigatorDelegationUtils.sol:NavigatorDelegationUtils": delegationAddr,
  })
  const NavigatorSlashingUtils = await deploy("NavigatorSlashingUtils", {
    "contracts/navigator/libraries/NavigatorDelegationUtils.sol:NavigatorDelegationUtils": delegationAddr,
  })
  const NavigatorVotingUtils = await deploy("NavigatorVotingUtils")
  const NavigatorFeeUtils = await deploy("NavigatorFeeUtils")

  return {
    NavigatorStakingUtils,
    NavigatorDelegationUtils,
    NavigatorVotingUtils,
    NavigatorFeeUtils,
    NavigatorSlashingUtils,
    NavigatorLifecycleUtils,
  }
}
