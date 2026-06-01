/**
 * Upgrades B3TRChallenges proxy from V1 (version "1") to V2 (version "2").
 *
 * V2 gates join/claim on VeBetterPassport.isPerson() and skips non-persons when
 * computing bestScore in completeChallenge. Refund paths stay open.
 *
 * No new storage or reinitializer args — the upgrade only swaps the implementation
 * (and redeploys the challenge libraries).
 *
 * Pre-check: aborts if any already-Completed MaxActions/TopWinners challenge still has unclaimed
 * payouts. Those winners depend on the V2 `isEligibleWinner` snapshot which is populated only by V2's
 * completeChallenge — for a challenge that completed pre-upgrade the snapshot is empty and winners
 * would lose claim ability. The safety property therefore has to hold ON-CHAIN at upgrade time, not
 * just at scan time.
 */
import { getConfig } from "@repo/config"
import { EnvConfig } from "@repo/config/contracts"
import { ethers } from "hardhat"

import { upgradeProxy } from "../../../helpers"
import { challengesLibraries } from "../../../libraries"
import { B3TRChallenges, B3TRChallengesV1 } from "../../../../typechain-types"

const ChallengeStatusCompleted = 2
const ChallengeTypeMaxActions = 0
const SettlementModeTopWinners = 1

/**
 * Reverts if any MaxActions/TopWinners challenge has unclaimed payouts at upgrade time.
 * `eligibleWinnerCount`/`isEligibleWinner` are not exposed on the public ABI, so we conservatively flag
 * every completed TopWinners challenge whose `payoutsClaimed < bestCount`. On healthy state this is a
 * no-op; if it fires, the operator should investigate (admin `withdraw` + off-chain remediation, or
 * wait for the unclaimed winner to call before retrying).
 */
async function assertNoAtRiskChallenges(contract: B3TRChallengesV1) {
  const total: bigint = await contract.challengeCount()
  const atRisk: Array<{ id: number; bestCount: bigint; payoutsClaimed: bigint; totalPrize: bigint }> = []
  for (let i = 1n; i <= total; i++) {
    const c = await contract.getChallenge(i)
    if (
      Number(c.status) === ChallengeStatusCompleted &&
      Number(c.challengeType) === ChallengeTypeMaxActions &&
      Number(c.settlementMode) === SettlementModeTopWinners &&
      c.payoutsClaimed < c.bestCount
    ) {
      atRisk.push({
        id: Number(i),
        bestCount: c.bestCount,
        payoutsClaimed: c.payoutsClaimed,
        totalPrize: c.totalPrize,
      })
    }
  }
  if (atRisk.length === 0) {
    console.log(`Pre-check OK — 0 at-risk challenges across ${total} total.`)
    return
  }
  for (const r of atRisk) {
    console.error(
      `  AT-RISK challenge #${r.id} bestCount=${r.bestCount} payouts=${r.payoutsClaimed} totalPrize=${r.totalPrize}`,
    )
  }
  throw new Error(
    `Refusing to upgrade: ${atRisk.length} MaxActions/TopWinners challenge(s) have unclaimed payouts. ` +
      `Those winners would lose claim ability post-upgrade because the V2 isEligibleWinner snapshot is empty for ` +
      `challenges completed before the upgrade. Investigate (admin withdraw + off-chain remediation, or wait for ` +
      `the unclaimed winner to call) before retrying.`,
  )
}

async function main() {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    throw new Error("Missing NEXT_PUBLIC_APP_ENV")
  }

  const config = getConfig(process.env.NEXT_PUBLIC_APP_ENV as EnvConfig)
  const deployer = (await ethers.getSigners())[0]

  const b3trChallengesV1 = await ethers.getContractAt("B3TRChallengesV1", config.challengesContractAddress)
  const currentVersion = await b3trChallengesV1.version()
  console.log("Current B3TRChallenges version:", currentVersion)

  // Safety gate — enforced on-chain state, not just an advisory script.
  console.log("Running pre-upgrade at-risk scan…")
  await assertNoAtRiskChallenges(b3trChallengesV1)

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
