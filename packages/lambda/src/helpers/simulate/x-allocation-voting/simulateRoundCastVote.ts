import { AppConfig, getConfig } from "@repo/config"
import { distributeEmissions } from "../../../../../contracts/scripts/helpers/emissions"
import {
  Emissions__factory,
  X2EarnApps__factory,
  XAllocationVoting__factory,
} from "../../../../../contracts/typechain-types"
import { Clause, Address, ABIContract } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import { ethers } from "ethers"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys } from "../../../../../contracts/scripts/helpers/seedAccounts"

const NUM_VOTERS = 4

const waitForNextRound = async (thorClient: ThorClient, config: AppConfig) => {
  const nextRoundBlock = await thorClient.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thorClient.blocks.waitForBlockCompressed(Number(nextRoundBlock.result.array?.[0]), { intervalMs: 10000 })
}

const simulateRound = async () => {
  console.log("=== Starting Round Simulation ===")

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]

  console.log("Waiting for next round to start...")
  await waitForNextRound(thorClient, config)

  console.log("1. Starting new round...")

  await distributeEmissions(config.emissionsContractAddress, admin)
  console.log("Emissions distributed - new round started")

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`Using round ID: ${currentRoundId}`)

  console.log("3. Getting eligible apps for voting...")
  const allAppsResult = await thorClient.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    ABIContract.ofAbi(X2EarnApps__factory.abi).getFunction("allEligibleApps"),
    [],
  )
  const appIds = allAppsResult.result?.array?.[0] as string[]

  console.log("4. Casting votes with 4 accounts...")
  const voters = accounts.slice(1, NUM_VOTERS + 1)

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i]

    try {
      const appsToVote = [appIds[0]] // At least vote for one app

      const voteWeight = ethers.parseEther("1000") // 1000 VOT3 tokens worth
      const weights = appsToVote.map(() => voteWeight)

      const castVoteClause = Clause.callFunction(
        Address.of(config.xAllocationVotingContractAddress),
        ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVote"),
        [currentRoundId, appsToVote, weights],
      )

      await TransactionUtils.sendTx(thorClient as any, [castVoteClause], voter.pk, 5, true)

      console.log(`Voter ${i + 1} (${voter.address}) voted for ${appsToVote.length} apps`)
    } catch (error: any) {
      console.log(`Voter ${i + 1} failed to vote: ${error.message}`)
    }
  }

  console.log("=== Round Simulation Complete ===")
  console.log(`Round ${currentRoundId} has ${NUM_VOTERS} votes cast`)
}

simulateRound()
