import { AppConfig } from "@repo/config"
import { TestPk } from "@repo/contracts/scripts/helpers/seedAccounts"
import { ABIContract, Address, Clause, TransactionClause } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"
import { RelayerRewardsPool__factory } from "@vechain/vebetterdao-contracts"
import { TransactionUtils } from "@repo/utils"

export const registerRelayer = async (thorClient: ThorClient, config: AppConfig, relayer: TestPk, admin: TestPk) => {
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(config.relayerRewardsPoolContractAddress),
      ABIContract.ofAbi(RelayerRewardsPool__factory.abi).getFunction("registerRelayer"),
      [relayer.address.toString()],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, admin.pk)
}

export const isRegisteredRelayer = async (thorClient: ThorClient, config: AppConfig, relayer: TestPk) => {
  const result = await thorClient.contracts.executeCall(
    config.relayerRewardsPoolContractAddress,
    ABIContract.ofAbi(RelayerRewardsPool__factory.abi).getFunction("isRegisteredRelayer"),
    [relayer.address.toString()],
  )

  return result.result.plain
}

export const isRoundRewardsClaimableForRelayer = async (thorClient: ThorClient, config: AppConfig, roundId: string) => {
  const result = await thorClient.contracts.executeCall(
    config.relayerRewardsPoolContractAddress,
    ABIContract.ofAbi(RelayerRewardsPool__factory.abi).getFunction("isRewardClaimable"),
    [roundId],
  )

  return result.result.plain
}

export const rewardsClaimableForRelayer = async (
  thorClient: ThorClient,
  config: AppConfig,
  relayer: TestPk,
  roundId: string,
) => {
  const result = await thorClient.contracts.executeCall(
    config.relayerRewardsPoolContractAddress,
    ABIContract.ofAbi(RelayerRewardsPool__factory.abi).getFunction("claimableRewards"),
    [relayer.address.toString(), roundId],
  )

  return result.result.plain
}

export const claimRewardForRelayer = async (
  thorClient: ThorClient,
  config: AppConfig,
  relayer: TestPk,
  roundId: string,
) => {
  const clauses: TransactionClause[] = []

  clauses.push(
    Clause.callFunction(
      Address.of(config.relayerRewardsPoolContractAddress),
      ABIContract.ofAbi(RelayerRewardsPool__factory.abi).getFunction("claimRewards"),
      [roundId, relayer.address.toString()],
    ),
  )

  await TransactionUtils.sendTx(thorClient as any, clauses, relayer.pk)
}
