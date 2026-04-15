import { ethers } from "hardhat"
import { ChallengeCoreLogic, ChallengeSettlementLogic } from "../../typechain-types"

interface DeployChallengesLibrariesArgs {
  logOutput?: boolean
}

export type ChallengesLibraries = {
  ChallengeCoreLogic: ChallengeCoreLogic
  ChallengeSettlementLogic: ChallengeSettlementLogic
}

export async function challengesLibraries({
  logOutput = false,
}: DeployChallengesLibrariesArgs = {}): Promise<ChallengesLibraries> {
  const ChallengeCoreLogic = await ethers.getContractFactory("ChallengeCoreLogic")
  const ChallengeCoreLogicLib = (await ChallengeCoreLogic.deploy()) as ChallengeCoreLogic
  await ChallengeCoreLogicLib.waitForDeployment()
  logOutput && console.log("ChallengeCoreLogic Library deployed")

  const ChallengeSettlementLogic = await ethers.getContractFactory("ChallengeSettlementLogic", {
    libraries: {
      ChallengeCoreLogic: await ChallengeCoreLogicLib.getAddress(),
    },
  })
  const ChallengeSettlementLogicLib = (await ChallengeSettlementLogic.deploy()) as ChallengeSettlementLogic
  await ChallengeSettlementLogicLib.waitForDeployment()
  logOutput && console.log("ChallengeSettlementLogic Library deployed")

  return {
    ChallengeCoreLogic: ChallengeCoreLogicLib,
    ChallengeSettlementLogic: ChallengeSettlementLogicLib,
  }
}
