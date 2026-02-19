import { type TransactionClause, Clause, Address, ABIContract } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import type { VOT3, XAllocationVoting } from "@vechain/vebetterdao-contracts/typechain-types"
import type { SeedAccount } from "@vechain/vebetterdao-contracts/scripts/helpers/seedAccounts"
import { chunk } from "@vechain/vebetterdao-contracts/scripts/helpers/chunk"
import type { SimulationConfig } from "../simulation.config"

const thorClient = ThorClient.at(getConfig().nodeUrl)

export const castVotes = async (
  vot3: VOT3,
  xAllocationVoting: XAllocationVoting,
  accounts: SeedAccount[],
  roundId: number,
  apps: string[],
  simConfig: SimulationConfig,
) => {
  const start = performance.now()
  console.log(
    `  Casting ${simConfig.voteStrategy} votes for round ${roundId} (${accounts.length} accounts, ${apps.length} apps)...`,
  )
  if (apps.length === 0) throw new Error("No xDapps to vote for.")

  const snapshot = await xAllocationVoting.roundSnapshot(roundId)
  const threshold = await xAllocationVoting.votingThreshold()

  console.log(`    snapshot=${snapshot}, threshold=${threshold}`)

  const chunks = chunk(accounts, simConfig.chunkSize)
  const contractAddress = await xAllocationVoting.getAddress()
  let voted = 0
  let skipped = 0
  let errors = 0
  let chunkIdx = 0

  for (const accountChunk of chunks) {
    chunkIdx++
    await Promise.all(
      accountChunk.map(async account => {
        try {
          const addr = account.key.address.toString()
          const votePower = BigInt(await vot3.getPastVotes(addr, snapshot))
          if (votePower === 0n) {
            skipped++
            return
          }
          if (votePower < threshold) {
            skipped++
            return
          }

          const splits: { app: string; weight: bigint }[] = []

          if (simConfig.voteStrategy === "fixed") {
            for (let i = 0; i < Math.min(apps.length, simConfig.votePercentages.length); i++) {
              const pct = simConfig.votePercentages[i]
              if (pct > 0) {
                splits.push({ app: apps[i], weight: (votePower * BigInt(pct)) / 100n })
              }
            }
          } else {
            let randomApps = apps.filter(() => Math.floor(Math.random() * 2) == 0)
            if (!randomApps.length) randomApps = apps
            const perApp = votePower / BigInt(randomApps.length)
            randomApps.forEach(app => splits.push({ app, weight: perApp }))
          }

          if (splits.length === 0) return

          const clauses: TransactionClause[] = [
            Clause.callFunction(
              Address.of(contractAddress),
              ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVote"),
              [roundId, splits.map(s => s.app), splits.map(s => s.weight)],
            ),
          ]

          await TransactionUtils.sendTx(thorClient, clauses, account.key.pk)
          voted++
        } catch (e) {
          errors++
          if (simConfig.ignoreVoteErrors) {
            console.error(`    Error voting for ${account.key.address}:`, e)
          } else {
            throw e
          }
        }
      }),
    )
    if (chunkIdx % 3 === 0 || chunkIdx === chunks.length) {
      console.log(
        `    chunk ${chunkIdx}/${chunks.length} — voted=${voted}, skipped=${skipped}, errors=${errors} (${((performance.now() - start) / 1000).toFixed(1)}s)`,
      )
    }
  }
  console.log(
    `  Votes done: ${voted} voted, ${skipped} skipped, ${errors} errors (${((performance.now() - start) / 1000).toFixed(1)}s)`,
  )
}
