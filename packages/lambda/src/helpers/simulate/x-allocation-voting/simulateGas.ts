import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"
import { ethers } from "ethers"
import path from "path"
import dotenv from "dotenv"
import { Address, ABIContract, Clause, TransactionClause } from "@vechain/sdk-core"
import { VoterRewards__factory, XAllocationVoting__factory } from "../../../../../contracts/typechain-types"
import { getCurrentRoundId } from "../../xApps/getCurrentRoundId"
import { TransactionUtils } from "@repo/utils"

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") })
import { getTestKeys } from "../../../../../contracts/scripts/helpers/seedAccounts"

const NUM_VOTERS = 4

const simulateGas = async () => {
  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const accounts = getTestKeys(NUM_VOTERS + 1)
  const admin = accounts[0]

  const currentRoundId = await getCurrentRoundId(thorClient, config.xAllocationVotingContractAddress)
  console.log(`Using round ID: ${currentRoundId}`)

  const mugshotAppId = "0x2fc30c2ad41a2994061efaf218f1d52dc92bc4a31a0f02a4916490076a7a393a" // Mugshot Harcoded
  const appIds = [mugshotAppId]
  const appsToVote = [appIds[0]] // At least vote for one app

  const voteWeight = ethers.parseEther("1000") // 1000 VOT3 tokens worth
  const weights = appsToVote.map(() => voteWeight)
  const clauses: TransactionClause[] = []

  for (let i = 0; i < NUM_VOTERS; i++) {
    console.log(`Adding vote for voter ${i}`)
    clauses.push(
      Clause.callFunction(
        Address.of(config.xAllocationVotingContractAddress),
        ABIContract.ofAbi(XAllocationVoting__factory.abi).getFunction("castVote"),
        [currentRoundId, appsToVote, weights],
      ),
    )
  }

  const gasResult = await TransactionUtils.estimateGas(
    thorClient,
    [
      Clause.callFunction(
        Address.of(config.voterRewardsContractAddress),
        ABIContract.ofAbi(VoterRewards__factory.abi).getFunction("claimReward"),
        [currentRoundId, admin.address.toString()],
      ),
    ],
    admin.pk,
  )
  console.log(`Gas result: ${JSON.stringify(gasResult, null, 2)}`)
}

simulateGas()
