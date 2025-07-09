import { getConfig } from "@repo/config"
import { getTestKeys } from "../../../../../contracts/scripts/helpers/seedAccounts"
import { distributeEmissions } from "../../../../../contracts/scripts/helpers/emissions"
import { Emissions__factory, XAllocationVoting__factory } from "../../../../../contracts/typechain-types"
import { Clause, Address, ABIContract } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import { ethers } from "ethers"

const NUM_VOTERS = 5

export const simulateRound = async () => {
  console.log("=== Starting Round Simulation ===")

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]

  console.log("Waiting for next round to start...")

  const nextRoundBlock = await thorClient.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thorClient.blocks.waitForBlockCompressed(Number(nextRoundBlock.result.array?.[0]), { intervalMs: 10000 })

  console.log("1. Starting new round...")

  await distributeEmissions(config.emissionsContractAddress, admin)
  console.log("Emissions distributed - new round started")

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`Using round ID: ${currentRoundId}`)

  console.log("3. Getting eligible apps for voting...")
  const mugshotAppId = "0x2fc30c2ad41a2994061efaf218f1d52dc92bc4a31a0f02a4916490076a7a393a"
  const appIds = [mugshotAppId] // Mugshot Harcoded

  console.log("4. Casting votes with 4 accounts...")
  // Use 4 accounts to vote
  // addresses: 0x435933c8064b4Ae76bE665428e0307eF2cCFBD68, 0x0F872421Dc479F3c11eDd89512731814D0598dB5, 0xf077b491b355E64048cE21E3A6Fc4751eEeA77fa, 0x0F872421Dc479F3c11eDd89512731814D0598dB5
  const voters = accounts.slice(1, NUM_VOTERS + 1)

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i]

    try {
      const randomApps = appIds.filter(() => Math.random() > 0.5)
      const appsToVote = randomApps.length > 0 ? randomApps : [appIds[0]] // At least vote for one app

      const voteWeight = ethers.parseEther("1000") // 1000 VOT3 tokens worth
      const weights = appsToVote.map(() => voteWeight)

      const castVoteClause = Clause.callFunction(
        Address.of(config.xAllocationVotingContractAddress),
        ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVote"),
        [currentRoundId, appsToVote, weights],
      )

      await TransactionUtils.sendTx(thorClient, [castVoteClause], voter.pk)

      console.log(`Voter ${i + 1} (${voter.address}) voted for ${appsToVote.length} apps`)
    } catch (error: any) {
      console.log(`Voter ${i + 1} failed to vote: ${error.message}`)
    }
  }

  console.log("=== Round Simulation Complete ===")
  console.log(`Round ${currentRoundId} has ${NUM_VOTERS} votes cast`)
}

// simulateRound()
console.log(ethers.parseEther("1000"))
