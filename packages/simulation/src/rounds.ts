import { getConfig } from "@repo/config"
import { type TransactionClause, Clause, VTHO, Units } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { ThorClient } from "@vechain/sdk-network"
import { getTestKeys } from "@vechain/vebetterdao-contracts/scripts/helpers/seedAccounts"
import type { SeedAccount } from "@vechain/vebetterdao-contracts/scripts/helpers/seedAccounts"
import { startEmissions, distributeEmissions } from "@vechain/vebetterdao-contracts/scripts/helpers/emissions"
import { claimVoterRewards } from "@vechain/vebetterdao-contracts/scripts/helpers/voterRewards"
import { convertB3trForVot3 } from "@vechain/vebetterdao-contracts/scripts/helpers/swap"
import type { B3TR, VOT3, XAllocationVoting, VoterRewards } from "@vechain/vebetterdao-contracts/typechain-types"
import type { SimulationConfig } from "../simulation.config"
import { castVotes } from "./vote"
import { elapsed } from "./utils"

const thorClient = ThorClient.at(getConfig().nodeUrl)

const waitForNextBlock = async () => {
  const accounts = getTestKeys(2)
  const clauses: TransactionClause[] = [Clause.transferVTHOToken(accounts[1].address, VTHO.of(1, Units.wei))]
  await TransactionUtils.sendTx(thorClient, clauses, accounts[0].pk)
}

const moveBlocks = async (blocks: number) => {
  for (let i = 0; i < blocks; i++) {
    await waitForNextBlock()
  }
}

const waitForRoundToEnd = async (roundId: number, xAllocationVoting: XAllocationVoting) => {
  const deadline = await xAllocationVoting.roundDeadline(roundId)
  const currentBlock = await xAllocationVoting.clock()
  await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}

export const advanceRounds = async (
  simConfig: SimulationConfig,
  seedAccts: SeedAccount[],
  b3tr: B3TR,
  vot3: VOT3,
  xAllocationVoting: XAllocationVoting,
  voterRewards: VoterRewards,
) => {
  const config = getConfig()
  const admin = getTestKeys(10)[0]

  const start = performance.now()
  console.log("\n=== Starting round advancement ===")

  let roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
  if (roundId === 0) {
    console.log("No active round — starting round...")
    await startEmissions(config.emissionsContractAddress, admin)
    roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
    console.log(`Emissions started, round ${roundId} active (${elapsed(start)})`)
  }

  // Accounts were just seeded — their VOT3 balance wasn't captured in the
  // current round's snapshot. Advance past this round so the next snapshot
  // reflects the seeded balances.
  console.log(`Advancing past round ${roundId} so snapshot captures seeded balances...`)
  await waitForRoundToEnd(roundId, xAllocationVoting)
  await distributeEmissions(config.emissionsContractAddress, admin)
  roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
  console.log(`Advanced to round ${roundId} (${elapsed(start)})`)

  let xDapps = (await xAllocationVoting.getAppsOfRound(roundId)).map(app => app.id)
  if (xDapps.length === 0) {
    console.log(`No xDapps for round ${roundId}, waiting for next round...`)
    await waitForRoundToEnd(roundId, xAllocationVoting)
    await distributeEmissions(config.emissionsContractAddress, admin)
    roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
    xDapps = (await xAllocationVoting.getAppsOfRound(roundId)).map(app => app.id)
  }

  console.log(`\nStarting from round ${roundId}, simulating ${simConfig.numRounds} rounds with ${xDapps.length} apps`)
  console.log(`  Apps: ${xDapps.map(id => id.slice(0, 10) + "...").join(", ")}`)
  console.log(`  Options: claimRewards=${simConfig.claimRewards}, convertToVot3=${simConfig.convertRewardsToVot3}\n`)

  for (let i = 0; i < simConfig.numRounds; i++) {
    const roundStart = performance.now()

    if (i > 0) {
      console.log(`  Distributing emissions...`)
      await distributeEmissions(config.emissionsContractAddress, admin)
      roundId = parseInt((await xAllocationVoting.currentRoundId()).toString())
    }
    const roundState = await xAllocationVoting.state(roundId)
    console.log(`\n>>> Round ${roundId} [${i + 1}/${simConfig.numRounds}] (state=${roundState})`)
    if (roundState !== 0n) {
      console.error(`  SKIP — round not Active (state=${roundState})`)
      continue
    }
    // Advance 1 block so the round snapshot is in the past — getPastVotes
    // requires timepoint < clock() (strict), and distributeEmissions sets
    // voteStart = clock() = current block.
    await waitForNextBlock()

    console.log(`  Voting...`)
    await castVotes(vot3, xAllocationVoting, seedAccts, roundId, xDapps, simConfig)

    console.log(`  Waiting for round to end...`)
    await waitForRoundToEnd(roundId, xAllocationVoting)

    if (simConfig.claimRewards) {
      console.log(`  Claiming voter rewards...`)
      await claimVoterRewards(voterRewards, roundId, admin, seedAccts, true)
    }
    if (simConfig.convertRewardsToVot3) {
      const convertBatch = 20
      const totalBatches = Math.ceil(seedAccts.length / convertBatch)
      console.log(`  Converting B3TR -> VOT3 (${totalBatches} batches)...`)
      for (let j = 0; j < seedAccts.length; j += convertBatch) {
        await convertB3trForVot3(b3tr, vot3, seedAccts.slice(j, j + convertBatch))
      }
    }
    console.log(
      `  Round ${roundId} complete (${((performance.now() - roundStart) / 1000).toFixed(1)}s, total ${elapsed(start)})`,
    )
  }

  console.log(`\n=== All ${simConfig.numRounds} rounds complete (${elapsed(start)}) ===`)
}
