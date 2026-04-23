import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"
import { TransactionUtils } from "@repo/utils"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { getTestKey } from "../helpers/seedAccounts"
import { B3TRChallenges__factory } from "../../typechain-types"

const NUM_CHALLENGES = 200
const CREATE_BATCH_SIZE = 10
const SPONSORED_AMOUNT = ethers.parseEther("1")
const SPLIT_THRESHOLD = 3

const ChallengeKind = { Sponsored: 1 } as const
const ChallengeVisibility = { Public: 0 } as const
const ChallengeType = { SplitWin: 1 } as const

async function main() {
  const config = getConfig()
  const thorClient = ThorClient.at(config.nodeUrl)
  const [creator] = await ethers.getSigners()

  const creatorKey = getTestKey(0)
  if (creatorKey.address.toString().toLowerCase() !== creator.address.toLowerCase()) {
    throw new Error(`Creator address mismatch: sdk=${creatorKey.address} hardhat=${creator.address}`)
  }

  const challenges = await ethers.getContractAt("B3TRChallenges", config.challengesContractAddress, creator)
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const b3tr = await ethers.getContractAt("B3TR", config.b3trContractAddress, creator)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const startRound = currentRound + 1

  const totalSponsor = SPONSORED_AMOUNT * BigInt(NUM_CHALLENGES)

  console.log(`Creator: ${creator.address}`)
  console.log(`Challenges to create: ${NUM_CHALLENGES} (batch size ${CREATE_BATCH_SIZE})`)
  console.log(`Round: ${startRound} (current ${currentRound})`)
  console.log(
    `Sponsor/challenge: ${ethers.formatEther(SPONSORED_AMOUNT)} B3TR | Total: ${ethers.formatEther(totalSponsor)} B3TR\n`,
  )

  const minterRole = await b3tr.MINTER_ROLE()
  if (!(await b3tr.hasRole(minterRole, creator.address))) {
    throw new Error(`Creator ${creator.address} is missing B3TR MINTER_ROLE`)
  }

  const balance = await b3tr.balanceOf(creator.address)
  if (balance < totalSponsor) {
    await (await b3tr.mint(creator.address, totalSponsor - balance)).wait()
  }

  const allowance = await b3tr.allowance(creator.address, config.challengesContractAddress)
  if (allowance < totalSponsor) {
    await (await b3tr.approve(config.challengesContractAddress, totalSponsor)).wait()
  }

  const createFn = ABIContract.ofAbi(B3TRChallenges__factory.abi).getFunction("createChallenge")
  const challengeParams = {
    kind: ChallengeKind.Sponsored,
    visibility: ChallengeVisibility.Public,
    challengeType: ChallengeType.SplitWin,
    stakeAmount: SPONSORED_AMOUNT,
    startRound,
    endRound: startRound,
    threshold: SPLIT_THRESHOLD,
    numWinners: 2,
    appIds: [],
    invitees: [],
    title: "",
    description: "",
    imageURI: "",
    metadataURI: "",
  }

  const createClause = Clause.callFunction(Address.of(config.challengesContractAddress), createFn, [challengeParams])

  const initialCount = Number(await challenges.challengeCount())
  console.log(`Initial challengeCount: ${initialCount}\n`)

  let created = 0
  let failedBatches = 0
  for (let i = 0; i < NUM_CHALLENGES; i += CREATE_BATCH_SIZE) {
    const batchSize = Math.min(CREATE_BATCH_SIZE, NUM_CHALLENGES - i)
    const batchClauses = Array.from({ length: batchSize }, () => createClause)
    try {
      await TransactionUtils.sendTx(thorClient, batchClauses, creatorKey.pk)
      created += batchSize
    } catch (err) {
      failedBatches++
      console.log(`  Batch ${i / CREATE_BATCH_SIZE + 1} failed: ${(err as Error).message.slice(0, 200)}`)
    }
    console.log(`  Created: ${created}/${NUM_CHALLENGES} (failed batches: ${failedBatches})`)
  }

  const finalCount = Number(await challenges.challengeCount())
  console.log(
    `\nDone. challengeCount: ${initialCount} -> ${finalCount} (+${finalCount - initialCount}) | failedBatches=${failedBatches}`,
  )
}

main().catch(console.error)
