import { ethers } from "hardhat"
import { getConfig } from "@repo/config"
import { ThorClient } from "@vechain/sdk-network"
import { TransactionUtils } from "@repo/utils"
import { ABIContract, Address, Clause } from "@vechain/sdk-core"
import { airdropVTHO } from "../helpers/airdrop"
import { getTestKey, getTestKeys } from "../helpers/seedAccounts"
import { B3TRChallenges__factory } from "../../typechain-types"

const NUM_JOINERS = 2000
const JOIN_BATCH_SIZE = 50
const SPONSORED_AMOUNT = ethers.parseEther("500")
const VTHO_PER_ACCOUNT = 100n
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

  const joinerKeys = getTestKeys(NUM_JOINERS + 1).slice(1)

  const challenges = await ethers.getContractAt("B3TRChallenges", config.challengesContractAddress, creator)
  const xAllocationVoting = await ethers.getContractAt("XAllocationVoting", config.xAllocationVotingContractAddress)
  const b3tr = await ethers.getContractAt("B3TR", config.b3trContractAddress, creator)

  const currentRound = Number(await xAllocationVoting.currentRoundId())
  const startRound = currentRound + 1

  console.log(`Creator: ${creator.address}`)
  console.log(`Joiners: ${joinerKeys.length}`)
  console.log(`Round: ${startRound} (current ${currentRound})\n`)

  console.log(`Airdropping ${VTHO_PER_ACCOUNT} VTHO to ${NUM_JOINERS} joiners...`)
  await airdropVTHO(
    joinerKeys.map(j => j.address),
    VTHO_PER_ACCOUNT,
    creatorKey,
  )
  console.log(`VTHO airdrop done\n`)

  const minterRole = await b3tr.MINTER_ROLE()
  if (!(await b3tr.hasRole(minterRole, creator.address))) {
    throw new Error(`Creator ${creator.address} is missing B3TR MINTER_ROLE`)
  }

  const balance = await b3tr.balanceOf(creator.address)
  if (balance < SPONSORED_AMOUNT) {
    await (await b3tr.mint(creator.address, SPONSORED_AMOUNT - balance)).wait()
  }

  const allowance = await b3tr.allowance(creator.address, config.challengesContractAddress)
  if (allowance < SPONSORED_AMOUNT) {
    await (await b3tr.approve(config.challengesContractAddress, SPONSORED_AMOUNT)).wait()
  }

  const createTx = await challenges.createChallenge({
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
  })
  await createTx.wait()

  const challengeId = await challenges.challengeCount()
  console.log(`Created SplitWin Public challenge #${challengeId} (round ${startRound})\n`)

  console.log(`Joining challenge with ${NUM_JOINERS} participants (batches of ${JOIN_BATCH_SIZE})...`)
  const joinClause = Clause.callFunction(
    Address.of(config.challengesContractAddress),
    ABIContract.ofAbi(B3TRChallenges__factory.abi).getFunction("joinChallenge"),
    [challengeId],
  )

  let joined = 0
  let failed = 0
  for (let i = 0; i < joinerKeys.length; i += JOIN_BATCH_SIZE) {
    const batch = joinerKeys.slice(i, i + JOIN_BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map(joiner => TransactionUtils.sendTx(thorClient, [joinClause], joiner.pk)),
    )
    for (const r of results) {
      if (r.status === "fulfilled") joined++
      else failed++
    }
    console.log(`  Joined: ${joined}/${NUM_JOINERS} (failed: ${failed})`)
  }

  const challenge = await challenges.getChallenge(challengeId)
  console.log(
    `\nReady #${challengeId}: participants=${challenge.participantCount} (fulfilled=${joined} failed=${failed})`,
  )
}

main().catch(console.error)
