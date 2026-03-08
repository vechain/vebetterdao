import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"

import { getCurrentRoundId, getRoundSnapshot, getAutoVotingUsers, hasVoted } from "./contracts"
import { NetworkConfig, CycleResult, LogFn, SendTransaction } from "./types"

const xavAbi = ABIContract.ofAbi(XAllocationVoting__factory.abi)
const vrAbi = ABIContract.ofAbi(VoterRewards__factory.abi)

// ── Clause builders ─────────────────────────────────────────

function buildCastVoteClause(contractAddress: string, roundId: number, user: string): Clause {
  return Clause.callFunction(Address.of(contractAddress), xavAbi.getFunction("castVoteOnBehalfOf"), [user, roundId])
}

function buildClaimRewardClause(contractAddress: string, roundId: number, user: string): Clause {
  return Clause.callFunction(Address.of(contractAddress), vrAbi.getFunction("claimReward"), [roundId, user])
}

// ── Batch processing ────────────────────────────────────────

interface BatchOutcome {
  successful: number
  failed: { user: string; reason: string }[]
  transient: { user: string; reason: string }[]
  txIds: string[]
}

async function processBatch(
  thor: ThorClient,
  users: string[],
  clauseBuilder: (user: string) => Clause,
  walletAddress: string,
  sendTx: SendTransaction,
  batchSize: number,
  dryRun: boolean,
  log: LogFn,
): Promise<BatchOutcome> {
  const outcome: BatchOutcome = { successful: 0, failed: [], transient: [], txIds: [] }
  const queue = [...users]
  let batchNum = 0
  const totalBatches = Math.ceil(queue.length / batchSize)

  while (queue.length > 0) {
    batchNum++
    const batch = queue.splice(0, batchSize)
    const clauses = batch.map(clauseBuilder)

    log(`Batch ${batchNum}/${totalBatches} (${batch.length} users): simulating...`)

    try {
      const gasResult = await thor.gas.estimateGas(clauses, walletAddress, { gasPadding: 0.1 })

      if (gasResult.reverted) {
        log(`Batch ${batchNum}: gas estimation failed, isolating failures...`)
        await isolateAndRetry(thor, batch, clauseBuilder, walletAddress, sendTx, dryRun, outcome, log)
        continue
      }

      if (dryRun) {
        log(`Batch ${batchNum}: ✓ simulation OK (dry run)`)
        outcome.successful += batch.length
        outcome.txIds.push(`DRY_RUN_${batchNum}`)
        continue
      }

      const txId = await sendTx(clauses, gasResult.totalGas)
      const receipt = await thor.transactions.waitForTransaction(txId)

      if (receipt && !receipt.reverted) {
        log(`Batch ${batchNum}: ✓ ${batch.length} OK (tx: ${txId.slice(0, 10)}...)`)
        outcome.successful += batch.length
        outcome.txIds.push(txId)
      } else {
        log(`Batch ${batchNum}: tx reverted, isolating failures...`)
        await isolateAndRetry(thor, batch, clauseBuilder, walletAddress, sendTx, dryRun, outcome, log)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log(`Batch ${batchNum}: error - ${msg.slice(0, 100)}`)
      await isolateAndRetry(thor, batch, clauseBuilder, walletAddress, sendTx, dryRun, outcome, log)
    }

    await delay(100)
  }

  return outcome
}

async function isolateAndRetry(
  thor: ThorClient,
  users: string[],
  clauseBuilder: (user: string) => Clause,
  walletAddress: string,
  sendTx: SendTransaction,
  dryRun: boolean,
  outcome: BatchOutcome,
  log: LogFn,
): Promise<void> {
  const valid: string[] = []

  for (const user of users) {
    try {
      const gas = await thor.gas.estimateGas([clauseBuilder(user)], walletAddress, { gasPadding: 0.1 })
      if (gas.reverted) {
        const reason = gas.revertReasons?.[0] ? String(gas.revertReasons[0]) : "reverted"
        outcome.failed.push({ user, reason })
      } else {
        valid.push(user)
      }
    } catch (err) {
      outcome.failed.push({ user, reason: err instanceof Error ? err.message : String(err) })
    }
    await delay(20)
  }

  if (valid.length === 0) return

  if (dryRun) {
    outcome.successful += valid.length
    outcome.txIds.push("DRY_RUN_ISOLATED")
    log(`Isolated: ${valid.length} valid, ${users.length - valid.length} failed (dry run)`)
    return
  }

  const clauses = valid.map(clauseBuilder)
  try {
    const gas = await thor.gas.estimateGas(clauses, walletAddress, { gasPadding: 0.1 })
    if (gas.reverted) {
      valid.forEach(u => outcome.transient.push({ user: u, reason: "retry reverted" }))
      return
    }
    const txId = await sendTx(clauses, gas.totalGas)
    const receipt = await thor.transactions.waitForTransaction(txId)
    if (receipt && !receipt.reverted) {
      outcome.successful += valid.length
      outcome.txIds.push(txId)
      log(`Isolated: ✓ ${valid.length} OK (tx: ${txId.slice(0, 10)}...)`)
    } else {
      valid.forEach(u => outcome.transient.push({ user: u, reason: "tx reverted on retry" }))
    }
  } catch {
    valid.forEach(u => outcome.transient.push({ user: u, reason: "network error on retry" }))
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Public cycle runners ────────────────────────────────────

export async function runCastVoteCycle(
  thor: ThorClient,
  config: NetworkConfig,
  walletAddress: string,
  sendTx: SendTransaction,
  batchSize: number,
  dryRun: boolean,
  log: LogFn,
): Promise<CycleResult> {
  const roundId = await getCurrentRoundId(thor, config.xAllocationVotingAddress)
  const snapshot = await getRoundSnapshot(thor, config.xAllocationVotingAddress, roundId)

  log(`Fetching auto-voting users (round #${roundId}, snapshot block ${snapshot})...`)
  const allUsers = await getAutoVotingUsers(thor, config.xAllocationVotingAddress, snapshot)
  log(`Found ${allUsers.length} auto-voting users`)

  if (allUsers.length === 0) {
    return { phase: "vote", roundId, totalUsers: 0, successful: 0, failed: [], transient: [], txIds: [], dryRun }
  }

  // Filter out users who already voted (batched to avoid overwhelming the node)
  log("Checking who already voted...")
  const needsVote: string[] = []
  let alreadyVoted = 0
  const CHECK_BATCH = 50
  for (let i = 0; i < allUsers.length; i += CHECK_BATCH) {
    const chunk = allUsers.slice(i, i + CHECK_BATCH)
    const checks = await Promise.all(chunk.map(u => hasVoted(thor, config.xAllocationVotingAddress, roundId, u)))
    for (let j = 0; j < chunk.length; j++) {
      if (checks[j]) alreadyVoted++
      else needsVote.push(chunk[j]!)
    }
  }
  log(`${needsVote.length} users need voting (${alreadyVoted} already voted)`)

  if (needsVote.length === 0) {
    return {
      phase: "vote",
      roundId,
      totalUsers: allUsers.length,
      successful: 0,
      failed: [],
      transient: [],
      txIds: [],
      dryRun,
    }
  }

  const clauseBuilder = (user: string) => buildCastVoteClause(config.xAllocationVotingAddress, roundId, user)
  const result = await processBatch(thor, needsVote, clauseBuilder, walletAddress, sendTx, batchSize, dryRun, log)

  return {
    phase: "vote",
    roundId,
    totalUsers: allUsers.length,
    successful: result.successful,
    failed: result.failed,
    transient: result.transient,
    txIds: result.txIds,
    dryRun,
  }
}

export async function runClaimRewardCycle(
  thor: ThorClient,
  config: NetworkConfig,
  walletAddress: string,
  sendTx: SendTransaction,
  batchSize: number,
  dryRun: boolean,
  log: LogFn,
): Promise<CycleResult> {
  const currentRoundId = await getCurrentRoundId(thor, config.xAllocationVotingAddress)
  const previousRoundId = currentRoundId - 1
  if (previousRoundId <= 0) {
    log("No previous round to claim for")
    return { phase: "claim", roundId: 0, totalUsers: 0, successful: 0, failed: [], transient: [], txIds: [], dryRun }
  }

  const snapshot = await getRoundSnapshot(thor, config.xAllocationVotingAddress, previousRoundId)

  log(`Fetching auto-voting users for previous round #${previousRoundId}...`)
  const allUsers = await getAutoVotingUsers(thor, config.xAllocationVotingAddress, snapshot)
  log(`Found ${allUsers.length} users to claim for`)

  if (allUsers.length === 0) {
    return {
      phase: "claim",
      roundId: previousRoundId,
      totalUsers: 0,
      successful: 0,
      failed: [],
      transient: [],
      txIds: [],
      dryRun,
    }
  }

  const clauseBuilder = (user: string) => buildClaimRewardClause(config.voterRewardsAddress, previousRoundId, user)
  const result = await processBatch(thor, allUsers, clauseBuilder, walletAddress, sendTx, batchSize, dryRun, log)

  return {
    phase: "claim",
    roundId: previousRoundId,
    totalUsers: allUsers.length,
    successful: result.successful,
    failed: result.failed,
    transient: result.transient,
    txIds: result.txIds,
    dryRun,
  }
}
