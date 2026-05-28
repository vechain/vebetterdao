/**
 * Upgrades B3TRChallenges proxy from V1 (version "1") to V2 (version "2").
 *
 * V2 gates join/claim on VeBetterPassport.isPerson() and skips non-persons when
 * computing bestScore in completeChallenge. Refund paths stay open.
 *
 * No new storage or reinitializer args — the upgrade only swaps the implementation
 * (and redeploys the challenge libraries).
 */
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"

import { upgradeProxy } from "../../../helpers"
import { challengesLibraries } from "../../../libraries"
import { B3TRChallenges } from "../../../../typechain-types"

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  const b3trChallengesV1 = await ethers.getContractAt("B3TRChallengesV1", config.challengesContractAddress)
  const currentVersion = await b3trChallengesV1.version()
  console.log("Current B3TRChallenges version:", currentVersion)

  console.log(
    `Upgrading B3TRChallenges V1 → V2 at ${config.challengesContractAddress} on ${config.network.name} with ${deployer.address}`,
  )

  // Libraries are not versioned in this repo — redeploy fresh against the V2 sources.
  const { ChallengeCoreLogic, ChallengeSettlementLogic } = await challengesLibraries({ logOutput: true })

  const b3trChallengesV2 = (await upgradeProxy(
    "B3TRChallengesV1",
    "B3TRChallenges",
    config.challengesContractAddress,
    [],
    {
      version: 2,
      libraries: {
        ChallengeCoreLogic: await ChallengeCoreLogic.getAddress(),
        ChallengeSettlementLogic: await ChallengeSettlementLogic.getAddress(),
      },
    },
  )) as B3TRChallenges

  console.log("B3TRChallenges upgraded to V2")

  const version = await b3trChallengesV2.version()
  console.log(`New B3TRChallenges version: ${version}`)

  if (version !== "2") {
    throw new Error(`B3TRChallenges version is not 2: ${version}`)
  }

  process.exit(0)
}

main()
