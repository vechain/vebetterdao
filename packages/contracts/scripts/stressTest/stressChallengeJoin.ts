import { ethers } from "hardhat"
import { getConfig } from "@repo/config"

const NUM_JOINERS = 100
const BATCH_SIZE = 10
const SPONSORED_AMOUNT = ethers.parseEther("500")
const VTHO_PER_ACCOUNT = ethers.parseEther("100")
const VTHO_CONTRACT_ADDRESS = "0x0000000000000000000000000000456E65726779"
const MAX_ACTIONS_PER_USER = 5

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

  const b3tr = await ethers.getContractAt("B3TR", config.b3trContractAddress, creator)
  const challenges = await ethers.getContractAt("B3TRChallenges", config.challengesContractAddress, creator)
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const x2EarnApps = await ethers.getContractAt("X2EarnApps", config.x2EarnAppsContractAddress)
  const passport = await ethers.getContractAt("VeBetterPassport", config.veBetterPassportContractAddress, creator)
  const vtho = await ethers.getContractAt(VTHO_ABI, VTHO_CONTRACT_ADDRESS, creator)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const startRound = currentRound + 1

  const allApps = await x2EarnApps.apps()
  const appIds = allApps.map((a: { id: string }) => a.id)
  if (appIds.length === 0) throw new Error("No apps found")

  console.log(`Creator: ${creator.address} | Current round: ${currentRound}`)
  console.log(`Joiners: ${joiners.length} | Apps: ${appIds.length}\n`)

  // Fund joiners with VTHO for gas
  console.log(`Funding ${NUM_JOINERS} accounts with ${ethers.formatEther(VTHO_PER_ACCOUNT)} VTHO each...`)
  for (let i = 0; i < joiners.length; i++) {
    await (await vtho.transfer(joiners[i].address, VTHO_PER_ACCOUNT)).wait()
    if ((i + 1) % 20 === 0) console.log(`  Funded ${i + 1}/${NUM_JOINERS}`)
  }
  console.log(`  Funded ${NUM_JOINERS}/${NUM_JOINERS}\n`)

  // Create sponsored/public challenge (allApps)
  await (await b3tr.approve(config.challengesContractAddress, SPONSORED_AMOUNT)).wait()
  const tx = await challenges.createChallenge({
    kind: 1,
    visibility: 0,
    thresholdMode: 0,
    stakeAmount: SPONSORED_AMOUNT,
    startRound,
    endRound: startRound + 2,
    threshold: 0,
    appIds: [],
    invitees: [],
  })
  await tx.wait()

  const challengeId = await challenges.challengeCount()
  console.log(`Created sponsored challenge #${challengeId} (rounds ${startRound}-${startRound + 2})\n`)

  // Join in parallel batches
  console.log(`Joining challenge #${challengeId} in batches of ${BATCH_SIZE}...`)
  let joined = 0
  for (let i = 0; i < joiners.length; i += BATCH_SIZE) {
    const batch = joiners.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(signer =>
        challenges
          .connect(signer)
          .joinChallenge(challengeId)
          .then(t => t.wait()),
      ),
    )
    const failed = results.filter(r => r.status === "rejected")
    joined += batch.length - failed.length
    if (failed.length > 0) {
      console.log(`  Batch ${i / BATCH_SIZE + 1}: ${failed.length} failed`)
      failed.forEach(r => {
        if (r.status === "rejected") console.log(`    ${(r.reason as Error).message.slice(0, 120)}`)
      })
    }
    console.log(`  Joined ${joined}/${NUM_JOINERS}`)
  }

  // Register random actions for each joiner across the challenge rounds
  console.log(`\nRegistering random actions for ${joined} participants...`)
  let totalActions = 0
  for (let i = 0; i < joiners.length; i++) {
    const numActions = Math.floor(Math.random() * (MAX_ACTIONS_PER_USER + 1)) // 0..MAX
    for (let a = 0; a < numActions; a++) {
      const round = startRound + Math.floor(Math.random() * 3) // startRound to startRound+2
      const appId = appIds[Math.floor(Math.random() * appIds.length)]
      try {
        await (await passport.registerActionForRound(joiners[i].address, appId, round)).wait()
        totalActions++
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`  Action failed for joiner ${i}: ${msg.slice(0, 120)}`)
      }
    }
    if ((i + 1) % 20 === 0) console.log(`  Processed ${i + 1}/${NUM_JOINERS} (${totalActions} actions so far)`)
  }
  console.log(`  Registered ${totalActions} total actions\n`)

  const challenge = await challenges.getChallenge(challengeId)
  console.log(
    `Done! Challenge #${challengeId} has ${challenge.participantCount} participants, ${totalActions} actions registered`,
  )
}

main().catch(console.error)
