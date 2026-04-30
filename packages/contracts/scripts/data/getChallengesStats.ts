import { getConfig } from "@repo/config"
import { AppEnv } from "@repo/config/contracts"
import { ethers } from "hardhat"
import { B3TRChallenges__factory, XAllocationVotingGovernor__factory } from "../../typechain-types"

const CHUNK_SIZE = 25

const ChallengeStatusLabels = ["Pending", "Active", "Completed", "Cancelled", "Invalid"] as const
const ChallengeKindLabels = ["Stake", "Sponsored"] as const
const ChallengeTypeLabels = ["MaxActions", "SplitWin"] as const
const ChallengeVisibilityLabels = ["Public", "Private"] as const
const SettlementModeLabels = ["None", "TopWinners", "CreatorRefund", "SplitWinCompleted"] as const

type RawChallengeView = {
  challengeId: bigint
  kind: number
  visibility: number
  challengeType: number
  status: number
  settlementMode: number
  creator: string
  stakeAmount: bigint
  startRound: bigint
  endRound: bigint
  duration: bigint
  threshold: bigint
  numWinners: bigint
  winnersClaimed: bigint
  prizePerWinner: bigint
  allApps: boolean
  totalPrize: bigint
  participantCount: bigint
  invitedCount: bigint
  declinedCount: bigint
  selectedAppsCount: bigint
  winnersCount: bigint
  bestScore: bigint
  bestCount: bigint
  payoutsClaimed: bigint
  title: string
  description: string
  imageURI: string
  metadataURI: string
}

function inc(map: Map<number, number>, key: number) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function addBig(map: Map<number, bigint>, key: number, delta: bigint) {
  map.set(key, (map.get(key) ?? 0n) + delta)
}

function printBreakdown(title: string, labels: readonly string[], counts: Map<number, number>, total: number) {
  console.log(`\n----- ${title} -----`)
  for (let i = 0; i < labels.length; i++) {
    const c = counts.get(i) ?? 0
    const pct = total > 0 ? ((c / total) * 100).toFixed(1) : "0.0"
    console.log(`${labels[i].padEnd(22)} ${String(c).padStart(8)}  (${pct}%)`)
  }
}

function printB3trByStatus(statusCounts: Map<number, number>, b3trByStatus: Map<number, bigint>) {
  console.log("\n----- Total B3TR (totalPrize) by status -----")
  console.log("STATUS".padEnd(14) + "COUNT".padStart(8) + "  TOTAL_B3TR")
  console.log("─".repeat(50))
  for (let s = 0; s < ChallengeStatusLabels.length; s++) {
    const count = statusCounts.get(s) ?? 0
    const wei = b3trByStatus.get(s) ?? 0n
    console.log(ChallengeStatusLabels[s].padEnd(14) + String(count).padStart(8) + "  " + ethers.formatEther(wei))
  }
}

async function fetchAllChallenges(
  challenges: ReturnType<typeof B3TRChallenges__factory.connect>,
  count: number,
): Promise<RawChallengeView[]> {
  const ids = Array.from({ length: count }, (_, i) => i + 1)
  const out: RawChallengeView[] = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const slice = ids.slice(i, i + CHUNK_SIZE)
    const batch = await Promise.all(slice.map(id => challenges.getChallenge(id)))
    out.push(...(batch as unknown as RawChallengeView[]))
  }
  return out
}

async function main() {
  const [signer] = await ethers.getSigners()
  const config = getConfig(AppEnv.MAINNET)
  const challenges = B3TRChallenges__factory.connect(config.challengesContractAddress, signer)
  const xAllocation = XAllocationVotingGovernor__factory.connect(config.xAllocationVotingContractAddress, signer)

  const [challengeCountBn, currentRoundBn, maxParticipantsBn, minBetBn] = await Promise.all([
    challenges.challengeCount(),
    xAllocation.currentRoundId(),
    challenges.maxParticipants(),
    challenges.minBetAmount(),
  ])

  const total = Number(challengeCountBn)
  const currentRound = Number(currentRoundBn)

  console.log("\n======== VeBetterDAO Quest (B3TRChallenges) stats =========\n")
  console.log(`Network: ${config.environment}`)
  console.log(`Challenges contract: ${config.challengesContractAddress}`)
  console.log(`Current allocation round: ${currentRound}`)
  console.log(`maxParticipants (MaxActions cap): ${maxParticipantsBn.toString()}`)
  console.log(`minBetAmount: ${ethers.formatEther(minBetBn)} B3TR`)
  console.log(`Total quests created: ${total}`)

  if (total === 0) {
    console.log("\nNo challenges on chain.")
    return
  }

  const rows = await fetchAllChallenges(challenges, total)

  const byStatus = new Map<number, number>()
  const byKind = new Map<number, number>()
  const byType = new Map<number, number>()
  const byVisibility = new Map<number, number>()
  const bySettlement = new Map<number, number>()
  const b3trByStatus = new Map<number, bigint>()
  let sumParticipants = 0n
  let sumInvited = 0n
  let sumDeclined = 0n
  let totalB3tr = 0n
  const creatorCounts = new Map<string, number>()

  for (const r of rows) {
    const s = Number(r.status)
    const k = Number(r.kind)
    const t = Number(r.challengeType)
    const v = Number(r.visibility)
    const m = Number(r.settlementMode)

    inc(byStatus, s)
    inc(byKind, k)
    inc(byType, t)
    inc(byVisibility, v)
    inc(bySettlement, m)
    addBig(b3trByStatus, s, r.totalPrize)

    sumParticipants += r.participantCount
    sumInvited += r.invitedCount
    sumDeclined += r.declinedCount
    totalB3tr += r.totalPrize

    const c = r.creator.toLowerCase()
    creatorCounts.set(c, (creatorCounts.get(c) ?? 0) + 1)
  }

  const avgParticipants = total > 0 ? Number(sumParticipants) / total : 0
  const avgInvited = total > 0 ? Number(sumInvited) / total : 0
  const avgDeclined = total > 0 ? Number(sumDeclined) / total : 0

  const finished = (byStatus.get(2) ?? 0) + (byStatus.get(3) ?? 0) + (byStatus.get(4) ?? 0) // Completed + Cancelled + Invalid

  printBreakdown("By status", ChallengeStatusLabels, byStatus, total)
  printBreakdown("By kind", ChallengeKindLabels, byKind, total)
  printBreakdown("By type", ChallengeTypeLabels, byType, total)
  printBreakdown("By visibility", ChallengeVisibilityLabels, byVisibility, total)
  printBreakdown("By settlementMode", SettlementModeLabels, bySettlement, total)

  printB3trByStatus(byStatus, b3trByStatus)

  console.log("\n----- B3TR (totalPrize) -----")
  console.log(`Sum across all quests: ${ethers.formatEther(totalB3tr)} B3TR`)

  console.log("\n----- Participation (sums / averages) -----")
  console.log(`Sum participantCount:   ${sumParticipants.toString()}`)
  console.log(`Sum invitedCount:     ${sumInvited.toString()}`)
  console.log(`Sum declinedCount:    ${sumDeclined.toString()}`)
  console.log(`Avg participants/quest: ${avgParticipants.toFixed(2)}`)
  console.log(`Avg invited/quest:      ${avgInvited.toFixed(2)}`)
  console.log(`Avg declined/quest:     ${avgDeclined.toFixed(2)}`)

  console.log("\n----- Lifecycle snapshot -----")
  console.log(`Pending:           ${byStatus.get(0) ?? 0}`)
  console.log(`Active:            ${byStatus.get(1) ?? 0}`)
  console.log(`Terminal (2+3+4):  ${finished}`)

  const topCreators = [...creatorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  console.log("\n----- Top 10 creators by quest count -----")
  console.log("RANK  COUNT  ADDRESS")
  console.log("─".repeat(60))
  topCreators.forEach(([addr, n], idx) => {
    console.log(`${String(idx + 1).padStart(4)}  ${String(n).padStart(5)}  ${addr}`)
  })

  console.log("\n" + "=".repeat(60) + "\n")
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
