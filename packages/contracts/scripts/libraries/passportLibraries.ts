import { ethers } from "hardhat"

export async function passportLibraries() {
  // Deploy Passport Checks Logic
  const PassportChecksLogic = await ethers.getContractFactory("PassportChecksLogic")
  const PassportChecksLogicLib = await PassportChecksLogic.deploy()
  await PassportChecksLogicLib.waitForDeployment()

  // Deploy Passport Configurator
  const PassportConfigurator = await ethers.getContractFactory("PassportConfigurator")
  const PassportConfiguratorLib = await PassportConfigurator.deploy()
  await PassportConfiguratorLib.waitForDeployment()

  // Deploy Passport Delegation Logic
  const PassportDelegationLogic = await ethers.getContractFactory("PassportDelegationLogic")
  const PassportDelegationLogicLib = await PassportDelegationLogic.deploy()
  await PassportDelegationLogicLib.waitForDeployment()

  // Deploy Passport PoP Score Logic
  const PassportPoPScoreLogic = await ethers.getContractFactory("PassportPoPScoreLogic")
  const PassportPoPScoreLogicLib = await PassportPoPScoreLogic.deploy()
  await PassportPoPScoreLogicLib.waitForDeployment()

  // Deploy Passport Signaling Logic
  const PassportSignalingLogic = await ethers.getContractFactory("PassportSignalingLogic")
  const PassportSignalingLogicLib = await PassportSignalingLogic.deploy()
  await PassportSignalingLogicLib.waitForDeployment()

  // Deploy Passport Personhood Logic
  const PassportPersonhoodLogic = await ethers.getContractFactory("PassportPersonhoodLogic", {
    libraries: {
      PassportPoPScoreLogic: await PassportPoPScoreLogicLib.getAddress(),
      PassportDelegationLogic: await PassportDelegationLogicLib.getAddress(),
    },
  })
  const PassportPersonhoodLogicLib = await PassportPersonhoodLogic.deploy()
  await PassportPersonhoodLogicLib.waitForDeployment()

  // Deploy Passport Whitelist and Blacklist Logic
  const PassportWhitelistBlacklistLogic = await ethers.getContractFactory("PassportWhitelistAndBlacklistLogic")
  const PassportWhitelistBlacklistLogicLib = await PassportWhitelistBlacklistLogic.deploy()
  await PassportWhitelistBlacklistLogicLib.waitForDeployment()

  return {
    PassportChecksLogic: PassportChecksLogicLib,
    PassportConfigurator: PassportConfiguratorLib,
    PassportDelegationLogic: PassportDelegationLogicLib,
    PassportPersonhoodLogic: PassportPersonhoodLogicLib,
    PassportPoPScoreLogic: PassportPoPScoreLogicLib,
    PassportSignalingLogic: PassportSignalingLogicLib,
    PassportWhitelistBlacklistLogic: PassportWhitelistBlacklistLogicLib,
  }
}
