import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

const NUM_JOINERS = 100
const BATCH_SIZE = 10
const SPONSORED_AMOUNT = ethers.parseEther("500")
const VTHO_PER_ACCOUNT = ethers.parseEther("100")
const VTHO_CONTRACT_ADDRESS = "0x0000000000000000000000000000456E65726779"
const MAX_ACTIONS_PER_USER = 5
const SELECTED_APP_COUNT = 5
const SPLIT_THRESHOLD = 3
const PRIMARY_WINNER_ADDRESS = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"
const SECONDARY_WINNER_ADDRESS = "0x0F872421Dc479F3c11eDd89512731814D0598dB5"

const ChallengeKind = { Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0 } as const
const ThresholdMode = { None: 0, SplitAboveThreshold: 1 } as const

type WinnerMode = "max" | "split"

type ChallengePlan = {
  label: string
  startRound: number
  endRound: number
  appIds: string[]
  thresholdMode: number
  threshold: number
  winnerMode: WinnerMode
}

const VTHO_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_to", type: "address" },
      { internalType: "uint256", name: "_amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
]

function normalizeAddress(address: string): string {
  return address.toLowerCase()
}

function requireSigner(signers: HardhatEthersSigner[], address: string): HardhatEthersSigner {
  const signer = signers.find(s => normalizeAddress(s.address) === normalizeAddress(address))
  if (!signer) throw new Error(`Signer ${address} not found among joiners`)
  return signer
}

function randomInt(maxExclusive: number): number {
  return maxExclusive <= 0 ? 0 : Math.floor(Math.random() * maxExclusive)
}

function pickRandom<T>(items: T[]): T {
  return items[randomInt(items.length)]
}

function getRounds(startRound: number, endRound: number): number[] {
  return Array.from({ length: endRound - startRound + 1 }, (_, index) => startRound + index)
}

function getTargetActions(address: string, mode: WinnerMode): number {
  const normalized = normalizeAddress(address)

  if (mode === "max") {
    return normalized === normalizeAddress(PRIMARY_WINNER_ADDRESS)
      ? MAX_ACTIONS_PER_USER
      : randomInt(MAX_ACTIONS_PER_USER)
  }

  if (
    normalized === normalizeAddress(PRIMARY_WINNER_ADDRESS) ||
    normalized === normalizeAddress(SECONDARY_WINNER_ADDRESS)
  ) {
    return SPLIT_THRESHOLD
  }

  return randomInt(SPLIT_THRESHOLD)
}

async function joinChallengeInBatches(
  challengesAddress: string,
  challengeId: bigint,
  participants: HardhatEthersSigner[],
): Promise<HardhatEthersSigner[]> {
  console.log(`Joining challenge #${challengeId} in batches of ${BATCH_SIZE}...`)

  const joinedParticipants: HardhatEthersSigner[] = []

  for (let i = 0; i < participants.length; i += BATCH_SIZE) {
    const batch = participants.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(async signer => {
        const challenges = await ethers.getContractAt("B3TRChallenges", challengesAddress, signer)
        await (await challenges.joinChallenge(challengeId)).wait()
        return signer
      }),
    )

    let failedCount = 0
    for (const result of results) {
      if (result.status === "fulfilled") {
        joinedParticipants.push(result.value)
      } else {
        failedCount++
        console.log(`    ${(result.reason as Error).message.slice(0, 120)}`)
      }
    }

    if (failedCount > 0) {
      console.log(`  Batch ${i / BATCH_SIZE + 1}: ${failedCount} failed`)
    }

    console.log(`  Joined ${joinedParticipants.length}/${participants.length}`)
  }

  return joinedParticipants
}

async function registerActionsForChallenge(
  challengeId: bigint,
  winnerMode: WinnerMode,
  startRound: number,
  endRound: number,
  participants: HardhatEthersSigner[],
  actionAppIds: string[],
  passportAddress: string,
  registrar: HardhatEthersSigner,
): Promise<number> {
  const rounds = getRounds(startRound, endRound)
  const passport = await ethers.getContractAt("VeBetterPassport", passportAddress, registrar)

  console.log(`Registering ${winnerMode} actions for challenge #${challengeId}...`)

  let totalActions = 0
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const targetActions = getTargetActions(participant.address, winnerMode)

    for (let actionIndex = 0; actionIndex < targetActions; actionIndex++) {
      const round = winnerMode === "max" ? rounds[actionIndex % rounds.length] : pickRandom(rounds)
      const appId = winnerMode === "max" ? actionAppIds[actionIndex % actionAppIds.length] : pickRandom(actionAppIds)

      try {
        await (await passport.registerActionForRound(participant.address, appId, round)).wait()
        totalActions++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`  Action failed for ${participant.address}: ${msg.slice(0, 120)}`)
      }
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Processed ${i + 1}/${participants.length} (${totalActions} actions so far)`)
    }
  }

  console.log(`  Registered ${totalActions} total actions\n`)
  return totalActions
}

async function main() {
  const config = getConfig()
  const signers = await ethers.getSigners()
  const creator = signers[0]
  const joiners = signers.slice(1, NUM_JOINERS + 1)

  if (joiners.length < NUM_JOINERS) {
    throw new Error(
      `Need ${NUM_JOINERS + 1} signers but only have ${signers.length}. Increase 'count' in hardhat config.`,
    )
  }

  const primaryWinner = requireSigner(joiners, PRIMARY_WINNER_ADDRESS)
  const secondaryWinner = requireSigner(joiners, SECONDARY_WINNER_ADDRESS)

  const b3tr = await ethers.getContractAt("B3TR", config.b3trContractAddress, creator)
  const challenges = await ethers.getContractAt("B3TRChallenges", config.challengesContractAddress, creator)
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const x2EarnApps = await ethers.getContractAt("X2EarnApps", config.x2EarnAppsContractAddress)
  const vtho = await ethers.getContractAt(VTHO_ABI, VTHO_CONTRACT_ADDRESS, creator)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const baseStartRound = currentRound + 1

  const allApps = await x2EarnApps.apps()
  const allAppIds = allApps.map((a: { id: string }) => a.id)
  if (allAppIds.length < SELECTED_APP_COUNT) {
    throw new Error(`Need at least ${SELECTED_APP_COUNT} apps but only found ${allAppIds.length}`)
  }

  const selectedAppIds = allAppIds.slice(0, SELECTED_APP_COUNT)

  // All challenges start next round; keep only the original duration differences.
  const challengePlans: ChallengePlan[] = [
    {
      label: "MaxActions/1Round/5Apps",
      startRound: baseStartRound,
      endRound: baseStartRound,
      appIds: selectedAppIds,
      thresholdMode: ThresholdMode.None,
      threshold: 0,
      winnerMode: "max",
    },
    {
      label: "MaxActions/4Rounds/5Apps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: selectedAppIds,
      thresholdMode: ThresholdMode.None,
      threshold: 0,
      winnerMode: "max",
    },
    {
      label: "MaxActions/4Rounds/AllApps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: [],
      thresholdMode: ThresholdMode.None,
      threshold: 0,
      winnerMode: "max",
    },
    {
      label: "SplitPrize/4Rounds/AllApps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: [],
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      threshold: SPLIT_THRESHOLD,
      winnerMode: "split",
    },
    {
      label: "SplitPrize/4Rounds/5Apps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: selectedAppIds,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      threshold: SPLIT_THRESHOLD,
      winnerMode: "split",
    },
  ]

  console.log(`Creator: ${creator.address} | Current round: ${currentRound}`)
  console.log(`Joiners: ${joiners.length} | Apps: ${allAppIds.length}`)
  console.log(`Primary winner: ${primaryWinner.address}`)
  console.log(`Secondary winner: ${secondaryWinner.address}\n`)

  console.log(`Funding ${NUM_JOINERS} accounts with ${ethers.formatEther(VTHO_PER_ACCOUNT)} VTHO each...`)
  for (let i = 0; i < joiners.length; i++) {
    await (await vtho.transfer(joiners[i].address, VTHO_PER_ACCOUNT)).wait()
    if ((i + 1) % 20 === 0) console.log(`  Funded ${i + 1}/${NUM_JOINERS}`)
  }
  console.log(`  Funded ${NUM_JOINERS}/${NUM_JOINERS}\n`)

  const totalSponsoredAmount = SPONSORED_AMOUNT * BigInt(challengePlans.length)
  await (await b3tr.approve(config.challengesContractAddress, totalSponsoredAmount)).wait()

  for (const plan of challengePlans) {
    const tx = await challenges.createChallenge({
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: plan.thresholdMode,
      stakeAmount: SPONSORED_AMOUNT,
      startRound: plan.startRound,
      endRound: plan.endRound,
      threshold: plan.threshold,
      appIds: plan.appIds,
      invitees: [],
    })
    await tx.wait()

    const challengeId = await challenges.challengeCount()
    const actionAppIds = plan.appIds.length > 0 ? plan.appIds : allAppIds

    console.log(`Created ${plan.label} challenge #${challengeId} (rounds ${plan.startRound}-${plan.endRound})`)

    const joinedParticipants = await joinChallengeInBatches(config.challengesContractAddress, challengeId, joiners)
    const joinedAddresses = new Set(joinedParticipants.map(signer => normalizeAddress(signer.address)))

    if (!joinedAddresses.has(normalizeAddress(primaryWinner.address))) {
      throw new Error(`Primary winner ${primaryWinner.address} did not join challenge #${challengeId}`)
    }

    if (plan.winnerMode === "split" && !joinedAddresses.has(normalizeAddress(secondaryWinner.address))) {
      throw new Error(`Secondary winner ${secondaryWinner.address} did not join challenge #${challengeId}`)
    }

    const totalActions = await registerActionsForChallenge(
      challengeId,
      plan.winnerMode,
      plan.startRound,
      plan.endRound,
      joinedParticipants,
      actionAppIds,
      config.veBetterPassportContractAddress,
      creator,
    )

    const challenge = await challenges.getChallenge(challengeId)
    const primaryActions = await challenges.getParticipantActions(challengeId, primaryWinner.address)

    if (plan.winnerMode === "split") {
      const secondaryActions = await challenges.getParticipantActions(challengeId, secondaryWinner.address)
      console.log(
        `Ready #${challengeId}: participants=${challenge.participantCount} totalActions=${totalActions} primary=${primaryActions} secondary=${secondaryActions}\n`,
      )
    } else {
      console.log(
        `Ready #${challengeId}: participants=${challenge.participantCount} totalActions=${totalActions} primary=${primaryActions}\n`,
      )
    }
  }
}

main().catch(console.error)
