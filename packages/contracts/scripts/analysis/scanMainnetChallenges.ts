/**
 * Read-only audit of B3TRChallenges on mainnet to scope the impact of the V2 upgrade
 * (personhood gating + frozen eligibility snapshot).
 *
 * Run: NEXT_PUBLIC_APP_ENV=mainnet npx hardhat run scripts/analysis/scanMainnetChallenges.ts --network vechain_mainnet
 *
 * What we look for:
 * - At-risk: status==Completed, type==MaxActions, settlementMode==TopWinners, payoutsClaimed<bestCount.
 *   These winners would be unable to claim post-upgrade because the `isEligibleWinner` snapshot is empty
 *   (it is only populated by V2's completeChallenge).
 * - Pending / Active challenges complete under V2 logic — no risk.
 * - Cancelled / Invalid challenges use the refund branch — no risk.
 * - SplitWin challenges do not go through completeChallenge — no risk.
 * - CreatorRefund settlements skip the snapshot — no risk.
 */
import { ethers } from "hardhat"
import { B3TRChallenges__factory } from "../../typechain-types"

const MAINNET_CHALLENGES = "0x92a98f23ca4f9703781cf56088b76a1482667166"

const ChallengeKind = ["Stake", "Sponsored"] as const
const ChallengeVisibility = ["Public", "Private"] as const
const ChallengeType = ["MaxActions", "SplitWin"] as const
const ChallengeStatus = ["Pending", "Active", "Completed", "Cancelled", "Invalid"] as const
const SettlementMode = ["None", "TopWinners", "CreatorRefund", "SplitWinCompleted"] as const

async function main() {
  const provider = ethers.provider
  const challenges = new ethers.Contract(MAINNET_CHALLENGES, B3TRChallenges__factory.abi, provider)

  const version = await challenges.version()
  const total: bigint = await challenges.challengeCount()
  console.log(`B3TRChallenges @ ${MAINNET_CHALLENGES}`)
  console.log(`version=${version}  challengeCount=${total}`)

  const byStatus: Record<string, number> = {}
  const bySettlement: Record<string, number> = {}
  const atRisk: Array<{
    id: number
    title: string
    bestCount: bigint
    payoutsClaimed: bigint
    totalPrize: bigint
    creator: string
  }> = []
  const splitWinIncomplete: Array<{
    id: number
    title: string
    winnersClaimed: bigint
    numWinners: bigint
    totalPrize: bigint
  }> = []

  for (let i = 1n; i <= total; i++) {
    const c = await challenges.getChallenge(i)
    const status = ChallengeStatus[Number(c.status)] ?? `unknown(${c.status})`
    const settlement = SettlementMode[Number(c.settlementMode)] ?? `unknown(${c.settlementMode})`
    byStatus[status] = (byStatus[status] ?? 0) + 1
    bySettlement[settlement] = (bySettlement[settlement] ?? 0) + 1

    const isMaxActions = Number(c.challengeType) === 0
    const isSplitWin = Number(c.challengeType) === 1

    if (
      Number(c.status) === 2 /* Completed */ &&
      isMaxActions &&
      Number(c.settlementMode) === 1 /* TopWinners */ &&
      c.payoutsClaimed < c.bestCount
    ) {
      atRisk.push({
        id: Number(i),
        title: c.title,
        bestCount: c.bestCount,
        payoutsClaimed: c.payoutsClaimed,
        totalPrize: c.totalPrize,
        creator: c.creator,
      })
    }

    if (
      isSplitWin &&
      (Number(c.status) === 1 /* Active */ || Number(c.status) === 2) /* Completed */ &&
      c.winnersClaimed < c.numWinners
    ) {
      splitWinIncomplete.push({
        id: Number(i),
        title: c.title,
        winnersClaimed: c.winnersClaimed,
        numWinners: c.numWinners,
        totalPrize: c.totalPrize,
      })
    }

    process.stdout.write(
      `  #${i.toString().padStart(3)} ${ChallengeKind[Number(c.kind)]}/${ChallengeVisibility[Number(c.visibility)]}/${
        ChallengeType[Number(c.challengeType)]
      } status=${status} settlement=${settlement} bestCount=${c.bestCount} payouts=${
        c.payoutsClaimed
      } prize=${ethers.formatEther(c.totalPrize)}B3TR title="${(c.title || "").slice(0, 32)}"\n`,
    )
  }

  console.log("\n========== Summary by status ==========")
  for (const [k, v] of Object.entries(byStatus)) console.log(`  ${k.padEnd(12)} ${v}`)
  console.log("========== Summary by settlement ==========")
  for (const [k, v] of Object.entries(bySettlement)) console.log(`  ${k.padEnd(20)} ${v}`)

  console.log("\n========== AT-RISK (MaxActions TopWinners with unclaimed payouts) ==========")
  if (atRisk.length === 0) {
    console.log("  None. Safe to upgrade — no MaxActions winner would lose claim ability.")
  } else {
    let totalAtRisk = 0n
    for (const r of atRisk) {
      const unclaimedSlots = r.bestCount - r.payoutsClaimed
      const baseShare = r.totalPrize / r.bestCount
      const stranded = unclaimedSlots * baseShare
      totalAtRisk += stranded
      console.log(
        `  #${r.id} title="${r.title}" creator=${r.creator} unclaimed=${unclaimedSlots}/${r.bestCount} stranded≈${ethers.formatEther(stranded)} B3TR`,
      )
    }
    console.log(`  TOTAL at-risk ≈ ${ethers.formatEther(totalAtRisk)} B3TR (recoverable via admin withdraw)`)
  }

  console.log("\n========== SplitWin in-progress (informational, NOT at risk) ==========")
  if (splitWinIncomplete.length === 0) {
    console.log("  None.")
  } else {
    for (const s of splitWinIncomplete) {
      console.log(
        `  #${s.id} title="${s.title}" claimed=${s.winnersClaimed}/${s.numWinners} prize=${ethers.formatEther(s.totalPrize)} B3TR`,
      )
    }
    console.log(
      "  These complete via SplitWin first-to-claim (no completeChallenge / no snapshot); the V2 upgrade does not affect them.",
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
