import { getConfig } from "@repo/config"
import { distributeEmissions } from "../../../../../contracts/scripts/helpers/emissions"
import { XAllocationVoting__factory } from "../../../../../contracts/typechain-types"
import { Clause, Address, ABIContract } from "@vechain/sdk-core"
import { TransactionUtils } from "@repo/utils"
import { ThorClient } from "@vechain/sdk-network"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import { ethers } from "ethers"
import path from "path"
import dotenv from "dotenv"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys } from "../../../../../contracts/scripts/helpers/seedAccounts"
import { getAllEligibleApps, waitForRoundStart } from "../.."

const NUM_VOTERS = 4

const simulateRound = async () => {
  console.log("🚀 Starting round simulation")

  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]

  console.log("⏰ Waiting for next round to start...")
  await waitForRoundStart(thorClient, config)

  console.log("🔄 Starting new round...")
  await distributeEmissions(config.emissionsContractAddress, admin)

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`🎯 Round ID: ${currentRoundId}`)

  console.log("📱 Getting eligible apps...")
  const appIds = await getAllEligibleApps(thorClient, config)
  console.log(`✅ Found ${appIds.length} eligible apps`)

  console.log(`🗳️ Casting votes with ${NUM_VOTERS} accounts...`)
  const voters = accounts.slice(1, NUM_VOTERS + 1)

  for (let i = 0; i < voters.length; i++) {
    const voter = voters[i]

    try {
      const appsToVote = [appIds[0]]
      const voteWeight = ethers.parseEther("1000")
      const weights = appsToVote.map(() => voteWeight)

      const castVoteClause = Clause.callFunction(
        Address.of(config.xAllocationVotingContractAddress),
        ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVote"),
        [currentRoundId, appsToVote, weights],
      )

      await TransactionUtils.sendTx(thorClient as any, [castVoteClause], voter.pk, 5, true)

      console.log(`✅ Voter ${i + 1} (${voter.address.toString().slice(0, 8)}...) voted successfully`)
    } catch (error: any) {
      console.log(`❌ Voter ${i + 1} failed to vote: ${error.message}`)
    }
  }

  console.log(`🎉 Round simulation complete - ${NUM_VOTERS} votes cast in round ${currentRoundId}`)
}

simulateRound()
