import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

const NUM_PARTICIPANTS = 100
const BATCH_SIZE = 10
const STAKE_AMOUNT = ethers.parseEther("500")
const VTHO_PER_ACCOUNT = ethers.parseEther("100")
const VTHO_CONTRACT_ADDRESS = "0x0000000000000000000000000000456E65726779"
const MAX_ACTIONS_PER_USER = 5
const SELECTED_APP_COUNT = 5
const PRIMARY_WINNER_ADDRESS = "0x435933c8064b4Ae76bE665428e0307eF2cCFBD68"

const ChallengeKind = { Stake: 0 } as const
const ChallengeVisibility = { Private: 1 } as const
const ChallengeType = { MaxActions: 0 } as const

type ChallengePlan = {
  label: string
  startRound: number
  endRound: number
  appIds: string[]
}

const VTHO_ABI = [
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "balance", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
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
  if (!signer) throw new Error(`Signer ${address} not found among participants`)
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

function getTargetActions(address: string): number {
  return normalizeAddress(address) === normalizeAddress(PRIMARY_WINNER_ADDRESS)
    ? MAX_ACTIONS_PER_USER
    : randomInt(MAX_ACTIONS_PER_USER)
}

async function prepareParticipants(
  creator: HardhatEthersSigner,
  participants: HardhatEthersSigner[],
  challengesAddress: string,
  b3trAddress: string,
  stakeBudgetPerParticipant: bigint,
): Promise<void> {
  const b3tr = await ethers.getContractAt("B3TR", b3trAddress, creator)
  const vtho = await ethers.getContractAt(VTHO_ABI, VTHO_CONTRACT_ADDRESS, creator)
  const minterRole = await b3tr.MINTER_ROLE()

  if (!(await b3tr.hasRole(minterRole, creator.address))) {
    throw new Error(`Creator ${creator.address} is missing B3TR MINTER_ROLE`)
  }

  console.log(
    `Seeding ${participants.length} participants with ${ethers.formatEther(stakeBudgetPerParticipant)} B3TR and ${ethers.formatEther(VTHO_PER_ACCOUNT)} VTHO each...`,
  )

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const b3trBalance = await b3tr.balanceOf(participant.address)
    const b3trTopUp = b3trBalance >= stakeBudgetPerParticipant ? 0n : stakeBudgetPerParticipant - b3trBalance

    if (b3trTopUp > 0n) {
      await (await b3tr.mint(participant.address, b3trTopUp)).wait()
    }

    const vthoBalance = await vtho.balanceOf(participant.address)
    const vthoTopUp = vthoBalance >= VTHO_PER_ACCOUNT ? 0n : VTHO_PER_ACCOUNT - vthoBalance

    if (vthoTopUp > 0n) {
      await (await vtho.transfer(participant.address, vthoTopUp)).wait()
    }

    if ((i + 1) % 20 === 0 || i + 1 === participants.length) {
      console.log(`  Seeded ${i + 1}/${participants.length}`)
    }
  }

  console.log(
    `Approving ${participants.length} participants with ${ethers.formatEther(stakeBudgetPerParticipant)} B3TR allowance each...`,
  )

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const participantB3tr = await ethers.getContractAt("B3TR", b3trAddress, participant)
    const allowance = await participantB3tr.allowance(participant.address, challengesAddress)

    if (allowance < stakeBudgetPerParticipant) {
      await (await participantB3tr.approve(challengesAddress, stakeBudgetPerParticipant)).wait()
    }

    if ((i + 1) % 20 === 0 || i + 1 === participants.length) {
      console.log(`  Approved ${i + 1}/${participants.length}`)
    }
  }

  console.log("")
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
  startRound: number,
  endRound: number,
  participants: HardhatEthersSigner[],
  actionAppIds: string[],
  passportAddress: string,
  registrar: HardhatEthersSigner,
): Promise<number> {
  const rounds = getRounds(startRound, endRound)
  const passport = await ethers.getContractAt("VeBetterPassport", passportAddress, registrar)

  console.log(`Registering actions for challenge #${challengeId}...`)

  let totalActions = 0
  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const targetActions = getTargetActions(participant.address)

    for (let actionIndex = 0; actionIndex < targetActions; actionIndex++) {
      const round = rounds[actionIndex % rounds.length]
      const appId = actionAppIds.length === 1 ? actionAppIds[0] : pickRandom(actionAppIds)

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
  const participants = signers.slice(0, NUM_PARTICIPANTS)

  if (participants.length < NUM_PARTICIPANTS) {
    throw new Error(
      `Need ${NUM_PARTICIPANTS} signers but only have ${signers.length}. Increase 'count' in hardhat config.`,
    )
  }

  const creator = participants[0]
  const joiners = participants.slice(1)
  const primaryWinner = requireSigner(participants, PRIMARY_WINNER_ADDRESS)

  const challenges = await ethers.getContractAt("B3TRChallenges", config.challengesContractAddress, creator)
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const x2EarnApps = await ethers.getContractAt("X2EarnApps", config.x2EarnAppsContractAddress)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const baseStartRound = currentRound + 1

  const allApps = await x2EarnApps.apps()
  const allAppIds = allApps.map((a: { id: string }) => a.id)
  if (allAppIds.length < SELECTED_APP_COUNT) {
    throw new Error(`Need at least ${SELECTED_APP_COUNT} apps but only found ${allAppIds.length}`)
  }

  const selectedAppIds = allAppIds.slice(0, SELECTED_APP_COUNT)
  const challengePlans: ChallengePlan[] = [
    {
      label: "MaxActions/1Round/5Apps",
      startRound: baseStartRound,
      endRound: baseStartRound,
      appIds: selectedAppIds,
    },
    {
      label: "MaxActions/4Rounds/5Apps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: selectedAppIds,
    },
    {
      label: "MaxActions/4Rounds/AllApps",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: [],
    },
    {
      label: "MaxActions/1Round/AllApps",
      startRound: baseStartRound,
      endRound: baseStartRound,
      appIds: [],
    },
    {
      label: "MaxActions/4Rounds/1App",
      startRound: baseStartRound,
      endRound: baseStartRound + 3,
      appIds: selectedAppIds.slice(0, 1),
    },
  ]

  const stakeBudgetPerParticipant = STAKE_AMOUNT * BigInt(challengePlans.length)

  console.log(`Creator: ${creator.address} | Current round: ${currentRound}`)
  console.log(`Participants: ${participants.length} (${joiners.length} joiners + creator) | Apps: ${allAppIds.length}`)
  console.log(`Primary winner: ${primaryWinner.address}`)
  console.log(
    `Stake/challenge: ${ethers.formatEther(STAKE_AMOUNT)} B3TR | Stake/participant: ${ethers.formatEther(stakeBudgetPerParticipant)} B3TR\n`,
  )

  await prepareParticipants(
    creator,
    participants,
    config.challengesContractAddress,
    config.b3trContractAddress,
    stakeBudgetPerParticipant,
  )

  for (const plan of challengePlans) {
    const tx = await challenges.createChallenge({
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      challengeType: ChallengeType.MaxActions,
      stakeAmount: STAKE_AMOUNT,
      startRound: plan.startRound,
      endRound: plan.endRound,
      threshold: 0,
      numWinners: 0,
      appIds: plan.appIds,
      invitees: joiners.map(s => s.address),
      title: "",
      description: "",
      imageURI: "",
      metadataURI: "",
    })
    await tx.wait()

    const challengeId = await challenges.challengeCount()
    const actionAppIds = plan.appIds.length > 0 ? plan.appIds : allAppIds

    console.log(`Created ${plan.label} challenge #${challengeId} (rounds ${plan.startRound}-${plan.endRound})`)

    const joinedParticipants = await joinChallengeInBatches(config.challengesContractAddress, challengeId, joiners)
    if (joinedParticipants.length !== joiners.length) {
      throw new Error(`Only ${joinedParticipants.length}/${joiners.length} joiners joined challenge #${challengeId}`)
    }

    const allParticipants = [creator, ...joinedParticipants]
    const joinedAddresses = new Set(allParticipants.map(signer => normalizeAddress(signer.address)))

    if (!joinedAddresses.has(normalizeAddress(primaryWinner.address))) {
      throw new Error(`Primary winner ${primaryWinner.address} did not join challenge #${challengeId}`)
    }

    const totalActions = await registerActionsForChallenge(
      challengeId,
      plan.startRound,
      plan.endRound,
      allParticipants,
      actionAppIds,
      config.veBetterPassportContractAddress,
      creator,
    )

    const challenge = await challenges.getChallenge(challengeId)
    if (challenge.participantCount !== BigInt(NUM_PARTICIPANTS)) {
      throw new Error(
        `Challenge #${challengeId} has ${challenge.participantCount} participants instead of ${NUM_PARTICIPANTS}`,
      )
    }

    const primaryActions = await challenges.getParticipantActions(challengeId, primaryWinner.address)
    console.log(
      `Ready #${challengeId}: participants=${challenge.participantCount} totalActions=${totalActions} primary=${primaryActions}\n`,
    )
  }
}

main().catch(console.error)
