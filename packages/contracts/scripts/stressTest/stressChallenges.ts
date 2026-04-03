import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"

const STAKE_AMOUNT = ethers.parseEther("100")
const SPONSORED_AMOUNT = ethers.parseEther("500")
const NUM_ACCOUNTS = 10

const ChallengeKind = { Stake: 0, Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0, Private: 1 } as const
const ThresholdMode = { None: 0, SplitAboveThreshold: 1, TopAboveThreshold: 2 } as const

type ChallengeDef = {
  label: string
  kind: number
  visibility: number
  thresholdMode: number
  stakeAmount: bigint
  startRound: number
  endRound: number
  threshold: number
  appIds: string[]
  invitees: string[]
}

function buildChallengeDefs(startRound: number, invitees: string[], appIds: string[]): ChallengeDef[] {
  return [
    // --- Stake / Public ---
    {
      label: "Stake/Public/AllApps",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: [],
    },
    {
      label: "Stake/Public/1App/Short",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound,
      threshold: 0,
      appIds: appIds.slice(0, 1),
      invitees: [],
    },
    {
      label: "Stake/Public/2Apps",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 0,
      appIds: appIds.slice(0, 2),
      invitees: [],
    },
    {
      label: "Stake/Public/3Apps",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 0,
      appIds: appIds.slice(0, 3),
      invitees: [],
    },
    {
      label: "Stake/Public/HighStake",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT * 5n,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: [],
    },
    {
      label: "Stake/Public/LowStake",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: ethers.parseEther("10"),
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: appIds.slice(0, 1),
      invitees: [],
    },
    {
      label: "Stake/Public/LongDuration",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound: startRound + 1,
      endRound: startRound + 3,
      threshold: 0,
      appIds: appIds.slice(0, 2),
      invitees: [],
    },

    // --- Stake / Private ---
    {
      label: "Stake/Private/1Invitee",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: invitees.slice(0, 1),
    },
    {
      label: "Stake/Private/3Invitees",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 0,
      appIds: appIds.slice(0, 2),
      invitees: invitees.slice(0, 3),
    },
    {
      label: "Stake/Private/5Invitees/AllApps",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT * 2n,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: invitees.slice(0, 5),
    },

    // --- Sponsored / Public ---
    {
      label: "Sponsored/Public/AllApps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: [],
    },
    {
      label: "Sponsored/Public/2Apps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 0,
      appIds: appIds.slice(0, 2),
      invitees: [],
    },
    {
      label: "Sponsored/Public/Split/3Apps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 3,
      appIds: appIds.slice(0, 3),
      invitees: [],
    },
    {
      label: "Sponsored/Public/Split/AllApps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT * 2n,
      startRound,
      endRound: startRound + 1,
      threshold: 5,
      appIds: [],
      invitees: [],
    },
    {
      label: "Sponsored/Public/Top/AllApps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.TopAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 5,
      appIds: [],
      invitees: [],
    },
    {
      label: "Sponsored/Public/Top/2Apps",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.TopAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 2,
      appIds: appIds.slice(0, 2),
      invitees: [],
    },

    // --- Sponsored / Private ---
    {
      label: "Sponsored/Private/3Invitees",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.None,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: [],
      invitees: invitees.slice(0, 3),
    },
    {
      label: "Sponsored/Private/5Invitees/Split",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.SplitAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 2,
      threshold: 3,
      appIds: appIds.slice(0, 2),
      invitees: invitees.slice(0, 5),
    },
    {
      label: "Sponsored/Private/Top/1Invitee",
      kind: ChallengeKind.Sponsored,
      visibility: ChallengeVisibility.Private,
      thresholdMode: ThresholdMode.TopAboveThreshold,
      stakeAmount: SPONSORED_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 2,
      appIds: appIds.slice(0, 1),
      invitees: invitees.slice(0, 1),
    },

    // --- Edge cases ---
    {
      label: "Stake/Public/MaxApps",
      kind: ChallengeKind.Stake,
      visibility: ChallengeVisibility.Public,
      thresholdMode: ThresholdMode.None,
      stakeAmount: STAKE_AMOUNT,
      startRound,
      endRound: startRound + 1,
      threshold: 0,
      appIds: appIds.slice(0, 5),
      invitees: [],
    },
  ]
}

function computeTotalCost(defs: ChallengeDef[]): bigint {
  return defs.reduce((sum, d) => sum + d.stakeAmount, 0n)
}

async function seedForAccount(
  idx: number,
  signer: HardhatEthersSigner,
  invitees: string[],
  challengesAddr: string,
  b3trAddr: string,
  startRound: number,
  appIds: string[],
) {
  const b3tr = await ethers.getContractAt("B3TR", b3trAddr, signer)
  const challenges = await ethers.getContractAt("B3TRChallenges", challengesAddr, signer)

  const defs = buildChallengeDefs(startRound, invitees, appIds)
  const totalCost = computeTotalCost(defs)

  const balance = await b3tr.balanceOf(signer.address)
  if (balance < totalCost) {
    console.log(
      `  [Account ${idx}] Skip — insufficient B3TR (have ${ethers.formatEther(balance)}, need ${ethers.formatEther(totalCost)})`,
    )
    return 0
  }

  const allowance = await b3tr.allowance(signer.address, challengesAddr)
  if (allowance < totalCost) {
    const tx = await b3tr.approve(challengesAddr, totalCost)
    await tx.wait()
  }

  let created = 0
  for (let i = 0; i < defs.length; i++) {
    const { label, ...params } = defs[i]
    try {
      const tx = await challenges.createChallenge(params)
      await tx.wait()
      created++
      console.log(`  [Account ${idx}] ${i + 1}/${defs.length} ${label}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  [Account ${idx}] ${i + 1}/${defs.length} FAILED ${label}: ${msg.slice(0, 150)}`)
    }
  }
  return created
}

async function main() {
  const config = getConfig()
  const signers = await ethers.getSigners()
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const x2EarnApps = await ethers.getContractAt("X2EarnApps", config.x2EarnAppsContractAddress)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const startRound = currentRound + 1
  const allApps = await x2EarnApps.apps()
  const appIds = allApps.slice(0, 5).map((a: { id: string }) => a.id)
  const challengesAddr = config.challengesContractAddress

  const sampleDefs = buildChallengeDefs(startRound, [], appIds)
  const costPerAccount = computeTotalCost(sampleDefs)

  console.log(`Current round: ${currentRound} | Apps: ${appIds.length} | Accounts: ${NUM_ACCOUNTS}`)
  console.log(
    `Challenges per account: ${sampleDefs.length} | B3TR per account: ${ethers.formatEther(costPerAccount)}\n`,
  )

  let totalCreated = 0
  for (let idx = 0; idx < NUM_ACCOUNTS; idx++) {
    const signer = signers[idx]
    const otherSigners = signers.filter((_, i) => i !== idx).map(s => s.address)
    console.log(`Account ${idx}: ${signer.address}`)
    totalCreated += await seedForAccount(
      idx,
      signer,
      otherSigners,
      challengesAddr,
      config.b3trContractAddress,
      startRound,
      appIds,
    )
  }

  const count = await (await ethers.getContractAt("B3TRChallenges", challengesAddr)).challengeCount()
  console.log(`\nCreated ${totalCreated} challenges (total on-chain: ${count})`)
}

main().catch(console.error)
