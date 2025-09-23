import { AppConfig } from "@repo/config"
import { TestPk } from "../../../../../../contracts/scripts/helpers/seedAccounts"
import { ThorClient } from "@vechain/sdk-network"
import { ABIContract, Address, Clause, TransactionClause } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { VoterRewards__factory, XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"

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
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("setUserVotingPreferences"),
      [apps],
    ),
  )

  clauses.push(
    Clause.callFunction(
      Address.of(config.xAllocationVotingContractAddress),
      ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("toggleAutoVoting"),
      [],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, account.pk, 5, true)
}

export const isAutoVotingEnabledForCurrentCycle = async (
  thorClient: ThorClient,
  config: AppConfig,
  account: TestPk,
) => {
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

export const claimRewardForUser = async (
  thorClient: ThorClient,
  config: AppConfig,
  account: TestPk,
  relayer: TestPk,
  currentRoundNumber: number,
) => {
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(config.voterRewardsContractAddress),
      ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
      [currentRoundNumber, account.address.toString()],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, relayer.pk, 5, true)
}

export const configureAutoVoting = async (
  thorClient: ThorClient,
  config: AppConfig,
  numVoters: number,
  seedAccounts: any[],
  appIds: string[],
) => {
  console.log(`🤖 Configuring auto-voting for ${numVoters} accounts`)

  let autoVotingConfigured = 0
  let alreadyEnabled = 0

  for (let i = 0; i < numVoters; i++) {
    const seedAccount = seedAccounts[i]
    const accountNumber = i + 1
    const isAutoVotingEnabledForUser = await isAutoVotingEnabledForCurrentCycle(thorClient, config, seedAccount.key)

    if (!isAutoVotingEnabledForUser) {
      try {
        await toggleAutoVotingAndSelectApps(thorClient, config, seedAccount.key, appIds)
        autoVotingConfigured++
        console.log(`✅ Account ${accountNumber}: Auto-voting enabled`)
      } catch (error) {
        console.log(`❌ Account ${accountNumber}: Failed to enable auto-voting - ${error}`)
      }
    } else {
      alreadyEnabled++
      console.log(`ℹ️  Account ${accountNumber}: Auto-voting already enabled`)
    }
  }

  console.log(`📊 Summary: ${autoVotingConfigured} configured, ${alreadyEnabled} already enabled`)
}
