import { AppConfig } from "@repo/config"
import { TestPk } from "@repo/contracts/scripts/helpers/seedAccounts"
import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, TransactionClause } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"

export const toggleAutoVotingAndSelectApps = async (
  thorClient: ThorClient,
  config: AppConfig,
  account: TestPk,
  apps: string[],
) => {
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(config.xAllocationVotingContractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("toggleAutoVoting"),
      [],
    ),
  )

  clauses.push(
    Clause.callFunction(
      Address.of(config.xAllocationVotingContractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("setUserVotingPreferences"),
      [apps],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, account.pk)
}

export const isAutoVotingEnabled = async (thorClient: ThorClient, config: AppConfig, account: TestPk) => {
  const autoVotingEnabled = await thorClient.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("isUserAutoVotingEnabledForCurrentCycle"),
    [account.address.toString()],
  )

  return autoVotingEnabled.result.plain
}

export const castVoteOnBehalfOf = async (
  thorClient: ThorClient,
  config: AppConfig,
  voterAddress: string,
  currentRoundNumber: number,
  account: TestPk,
) => {
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(config.xAllocationVotingContractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
      [voterAddress, currentRoundNumber],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, account.pk)
}

export const castVoteOnBehalfOfMultiClauses = async (
  thorClient: ThorClient,
  config: AppConfig,
  voters: TestPk[],
  currentRoundNumber: number,
  account: TestPk,
) => {
  const clauses: TransactionClause[] = []

  for (const voter of voters) {
    clauses.push(
      Clause.callFunction(
        Address.of(config.xAllocationVotingContractAddress),
        ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVoteOnBehalfOf"),
        [voter.address.toString(), currentRoundNumber],
      ),
    )
  }

  await TransactionUtils.sendTx(thorClient as any, clauses, account.pk, 5, true)
}

export const configureAutoVoting = async (
  thorClient: ThorClient,
  config: AppConfig,
  numVoters: number,
  seedAccounts: any[],
  appIds: string[],
) => {
  console.log("\n=== Configuring auto-voting ===")
  let autoVotingConfigured = 0

  for (let i = 0; i < numVoters; i++) {
    const seedAccount = seedAccounts[i]
    const isAutoVotingEnabledForUser = await isAutoVotingEnabled(thorClient, config, seedAccount.key)

    if (!isAutoVotingEnabledForUser) {
      await toggleAutoVotingAndSelectApps(thorClient, config, seedAccount.key, appIds)
      autoVotingConfigured++
      console.log(`Enabled auto-voting for account ${i + 1}: ${seedAccount.key.address}`)
    } else {
      console.log(`Auto-voting already enabled for account ${i + 1}: ${seedAccount.key.address}`)
    }
  }
  console.log(`Auto-voting configured for ${autoVotingConfigured} new accounts`)
}
