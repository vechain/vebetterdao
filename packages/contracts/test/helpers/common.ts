import { ethers, network } from "hardhat"
import { Emissions, XAllocationPool, XAllocationVoting, B3TR, B3TRBadge } from "../../typechain-types"
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { getOrDeployContractInstances } from "./deploy"
import { mine } from "@nomicfoundation/hardhat-network-helpers"

export const waitForNextBlock = async () => {
  if (network.name === "hardhat") {
    await mine(1)
    return
  }

  // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
  let startingBlock = await ethers.provider.getBlockNumber()
  let currentBlock
  do {
    await new Promise(resolve => setTimeout(resolve, 1000))
    currentBlock = await ethers.provider.getBlockNumber()
  } while (startingBlock === currentBlock)
}

export const moveBlocks = async (blocks: number) => {
  for (let i = 0; i < blocks; i++) {
    await waitForNextBlock()
  }
}

export const createProposal = async (
  contractToCall: BaseContract,
  ContractFactory: ContractFactory,
  proposer: HardhatEthersSigner,
  description: string = "",
  functionTocall: string = "tokenDetails",
  values: any[] = [],
  avoidMintingAndDelegating: boolean = false, // in some scenarios we want the operation to fail if the proposer does not have enough VOT3
  roundId?: string,
): Promise<ContractTransactionResponse> => {
  const { xAllocationVoting, governor } = await getOrDeployContractInstances({})

  // the proposer needs to have some delegated VOT3 to be able to create a proposal
  const clock = await governor.clock()
  const proposerVotes = await governor.getVotes(proposer, clock - BigInt(1))
  const votesThreshold = await governor.proposalThreshold()

  if (votesThreshold > proposerVotes && !avoidMintingAndDelegating) {
    //The proposer needs to have some delegated VOT3 to be able to create a proposal
    await getVot3Tokens(proposer, (votesThreshold + BigInt(1)).toString())
    // We also need to wait a block to update the proposer's votes snapshot
    await waitForNextBlock()
  }

  const address = await contractToCall.getAddress()
  const encodedFunctionCall = ContractFactory.interface.encodeFunctionData(functionTocall, values)

  const voteStartsInRoundId = roundId ?? ((await xAllocationVoting.currentRoundId()) + 1n).toString()

  const tx = await governor
    .connect(proposer) //@ts-ignore
    .propose([address], [0], [encodedFunctionCall], description, parseInt(voteStartsInRoundId), {
      gasLimit: 10_000_000,
    })

  return tx
}

export const getProposalIdFromTx = async (tx: ContractTransactionResponse) => {
  const { governor } = await getOrDeployContractInstances({})
  const proposeReceipt = await tx.wait()
  const event = proposeReceipt?.logs[0]
  const decodedLogs = governor.interface.parseLog({
    topics: [...(event?.topics as string[])],
    data: event ? event.data : "",
  })

  return decodedLogs?.args[0]
}

export const waitForVotingPeriodToEnd = async (proposalId: number) => {
  const { governor } = await getOrDeployContractInstances({})

  const deadline = await governor.proposalDeadline(proposalId)

  const currentBlock = await governor.clock()

  await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}

export const waitForRoundToEnd = async (roundId: number) => {
  const { xAllocationVoting } = await getOrDeployContractInstances({})
  const deadline = await xAllocationVoting.roundDeadline(roundId)

  const currentBlock = await xAllocationVoting.clock()

  await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}

export const waitForCurrentRoundToEnd = async () => {
  const { xAllocationVoting } = await getOrDeployContractInstances({})

  const currentRoundId = await xAllocationVoting.currentRoundId()
  await waitForRoundToEnd(Number(currentRoundId))
  await waitForNextBlock()
}

export const waitForProposalToBeActive = async (proposalId: number): Promise<bigint> => {
  const { governor } = await getOrDeployContractInstances({})
  let proposalState = await governor.state(proposalId) // proposal id of the proposal in the beforeAll step

  if (proposalState.toString() !== "1") {
    await moveToCycle(parseInt((await governor.proposalStartRound(proposalId)).toString()) + 1)

    // Update the proposal state
    proposalState = await governor.state(proposalId)
  }

  return proposalState
}

// Mint some B3TR and swap for VOT3
export const getVot3Tokens = async (receiver: HardhatEthersSigner, amount: string) => {
  const { b3tr, vot3, minterAccount } = await getOrDeployContractInstances({ forceDeploy: false })

  // Mint some B3TR
  await b3tr.connect(minterAccount).mint(receiver, ethers.parseEther(amount))

  // Approve VOT3 to spend B3TR on behalf of otherAccount. N.B. this is an important step and could be included in a multi clause transaction
  await b3tr.connect(receiver).approve(await vot3.getAddress(), ethers.parseEther(amount))

  // Lock B3TR to get VOT3
  await vot3.connect(receiver).stake(ethers.parseEther(amount))
}

export const createProposalAndExecuteIt = async (
  proposer: HardhatEthersSigner,
  voter: HardhatEthersSigner,
  contractToCall: BaseContract,
  Contract: ContractFactory,
  description: string,
  functionToCall: string,
  args: any[] = [],
) => {
  const { governor } = await getOrDeployContractInstances({})

  // load votes
  // console.log("Loading votes");
  await getVot3Tokens(voter, "1000")
  await waitForNextBlock()

  // create a new proposal
  // console.log("Creating proposal");
  const tx = await createProposal(contractToCall, Contract, proposer, description, functionToCall, args)
  const proposalId = await getProposalIdFromTx(tx)

  // wait
  // console.log("Waiting for voting period to start");
  await waitForProposalToBeActive(proposalId)

  // vote
  // console.log("Voting");
  await governor.connect(voter).castVote(proposalId, 1, { gasLimit: 10_000_000 }) // vote for

  // wait
  // console.log("Waiting for voting period to end");
  await waitForVotingPeriodToEnd(proposalId)

  // queue it
  // console.log("Queueing");
  const encodedFunctionCall = Contract.interface.encodeFunctionData(functionToCall, args)
  const descriptionHash = ethers.keccak256(ethers.toUtf8Bytes(description))
  await governor.queue([await contractToCall.getAddress()], [0], [encodedFunctionCall], descriptionHash, {
    gasLimit: 10_000_000,
  })
  await waitForNextBlock()

  // execute it
  // console.log("Executing");
  await governor.execute([await contractToCall.getAddress()], [0], [encodedFunctionCall], descriptionHash, {
    gasLimit: 10_000_000,
  })
}

export const addAppThroughGovernance = async (
  proposer: HardhatEthersSigner,
  voter: HardhatEthersSigner,
  appName: string = "Bike 4 Life" + Math.random(),
  appAddress: string,
  metadataURI: string = "metadataURI",
) => {
  const { xAllocationVoting } = await getOrDeployContractInstances({})

  await createProposalAndExecuteIt(
    proposer,
    voter,
    xAllocationVoting,
    await ethers.getContractFactory("XAllocationVoting"),
    "Add app to the list",
    "addApp",
    [appAddress, appAddress, appName, metadataURI],
  )
}

export const waitForBlock = async (blockNumber: number) => {
  const currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

  if (!currentBlock?.number) throw new Error("Could not get current block number")

  if (currentBlock?.number < blockNumber) {
    // Get blocks required to wait
    const blocksToWait = blockNumber - currentBlock?.number

    if (blocksToWait > 0) await moveBlocks(blocksToWait)
  }
}

export const waitForNextCycle = async () => {
  const { emissions } = await getOrDeployContractInstances({})

  const blockNextCycle = await emissions.getNextCycleBlock()

  await waitForBlock(Number(blockNextCycle))
}

/**
 * It will move to the desired cycle without actually distribute it.
 * E.g: we are in cycle 1 (distributed) and want to move to cycle 3 (not distributed) then we call this funciton with cycle 3
 * and it will distribute the cycle 2 and stop before distributing the cycle 3
 */
export const moveToCycle = async (cycle: number) => {
  const { emissions, minterAccount } = await getOrDeployContractInstances({})

  const cycleToBeDistributed = await emissions.nextCycle()

  for (let i = 0; i < BigInt(cycle) - cycleToBeDistributed; i++) {
    await waitForNextCycle()
    await emissions.connect(minterAccount).distribute()
  }
}

export const voteOnApps = async (
  apps: string[],
  voters: HardhatEthersSigner[],
  votes: Array<Array<bigint>>,
  roundId: bigint,
) => {
  const { xAllocationVoting } = await getOrDeployContractInstances({})

  for (const voter of voters) {
    await xAllocationVoting.connect(voter).castVote(roundId, apps, votes[voters.indexOf(voter)])
  }
}

export const addAppsToAllocationVoting = async (apps: string[], owner: HardhatEthersSigner) => {
  const { xAllocationVoting } = await getOrDeployContractInstances({})

  let appIds: string[] = []
  for (const app of apps) {
    await xAllocationVoting.connect(owner).addApp(app, app, app, "metadataURI")
    appIds.push(ethers.keccak256(ethers.toUtf8Bytes(app)))
  }

  return appIds
}

export const startNewAllocationRound = async () => {
  const { emissions, xAllocationVoting, minterAccount } = await getOrDeployContractInstances({})
  const nextCycle = await emissions.nextCycle()

  if (nextCycle === 0n) {
    await bootstrapAndStartEmissions()
  } else if (nextCycle === 1n) {
    await emissions.connect(minterAccount).start()
  } else {
    await emissions.distribute()
  }

  return Number(await xAllocationVoting.currentRoundId())
}

export const calculateBaseAllocationOffChain = async (
  roundId: number,
  emissions: Emissions,
  xAllocationVoting: XAllocationVoting,
) => {
  // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
  let totalAmount = await emissions.getXAllocationAmount(roundId)

  let elegibleApps = await xAllocationVoting.getRoundApps(roundId)

  const baseAllcoationPercentage = await xAllocationVoting.getRoundBaseAllocationPercentage(roundId)

  let remaining = (totalAmount * baseAllcoationPercentage) / BigInt(100)

  let amountPerApp = remaining / BigInt(elegibleApps.length)

  return amountPerApp
}

export const calculateVariableAppAllocationOffChain = async (
  roundId: number,
  appId: string,
  emissions: Emissions,
  xAllocationPool: XAllocationPool,
  xAllocationVoting: XAllocationVoting,
) => {
  // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
  let totalAmount = await emissions.getXAllocationAmount(roundId)

  let totalAvailable =
    (totalAmount * (BigInt(100) - (await xAllocationVoting.getRoundBaseAllocationPercentage(roundId)))) / BigInt(100)

  const roundAppShares = await xAllocationPool.getAppShares(roundId, appId)

  let appShares = roundAppShares[0] / BigInt(100)

  return (totalAvailable * appShares) / BigInt(100)
}

export const calculateUnallocatedAppAllocationOffChain = async (
  roundId: number,
  appId: string,
  emissions: Emissions,
  xAllocationPool: XAllocationPool,
  xAllocationVoting: XAllocationVoting,
) => {
  // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
  let totalAmount = await emissions.getXAllocationAmount(roundId)

  let totalAvailable =
    (totalAmount * (BigInt(100) - (await xAllocationVoting.getRoundBaseAllocationPercentage(roundId)))) / BigInt(100)

  const roundAppShares = await xAllocationPool.getAppShares(roundId, appId)

  let appShares = roundAppShares[1] / BigInt(100)

  return (totalAvailable * appShares) / BigInt(100)
}

export const participateInAllocationVoting = async (
  user: HardhatEthersSigner,
  admin: HardhatEthersSigner,
  xAllocationVoting: XAllocationVoting,
  waitRoundToEnd: boolean = false,
) => {
  await getVot3Tokens(user, "1")
  await getVot3Tokens(admin, "1000")

  const appName = "App" + Math.random()

  await xAllocationVoting.connect(admin).addApp(user.address, user.address, appName, "metadataURI")
  const roundId = await startNewAllocationRound()

  // Vote
  await xAllocationVoting
    .connect(user)
    .castVote(roundId, [await xAllocationVoting.hashName(appName)], [ethers.parseEther("1")])

  if (waitRoundToEnd) {
    await waitForRoundToEnd(roundId)
  }
}

export const participateInGovernanceVoting = async (
  user: HardhatEthersSigner,
  admin: HardhatEthersSigner,
  contractToCall: BaseContract,
  Contract: ContractFactory,
  description: string,
  functionToCall: string,
  args: any[] = [],
  waitProposalToEnd: boolean = false,
) => {
  const { governor } = await getOrDeployContractInstances({})

  await getVot3Tokens(user, "1")
  await getVot3Tokens(admin, "1000")

  const tx = await createProposal(contractToCall, Contract, admin, description, functionToCall, args, false)
  const proposalId = await getProposalIdFromTx(tx)

  await waitForProposalToBeActive(proposalId)

  // Vote
  await governor.connect(user).castVote(proposalId, 1)

  if (waitProposalToEnd) {
    await waitForVotingPeriodToEnd(proposalId)
  }
}

export const bootstrapEmissions = async () => {
  const { b3tr, owner, emissions, minterAccount } = await getOrDeployContractInstances({})
  // Grant minter role to emissions contract
  await b3tr.connect(owner).grantRole(await b3tr.MINTER_ROLE(), await emissions.getAddress())

  // Bootstrap emissions
  await emissions.connect(minterAccount).bootstrap()
}

export const bootstrapAndStartEmissions = async () => {
  const { emissions, minterAccount } = await getOrDeployContractInstances({})
  await bootstrapEmissions()

  // Start emissions
  await emissions.connect(minterAccount).start()
}

export const upgradeNFTtoLevel = async (
  tokenId: number,
  level: number,
  nft: B3TRBadge,
  b3tr: B3TR,
  owner: HardhatEthersSigner,
  minter: HardhatEthersSigner,
) => {
  const currentLevel = await nft.levelOf(tokenId)

  for (let i = currentLevel; i < level; i++) {
    await upgradeNFTtoNextLevel(tokenId, nft, b3tr, owner, minter)
  }
}

export const upgradeNFTtoNextLevel = async (
  tokenId: number,
  nft: B3TRBadge,
  b3tr: B3TR,
  owner: HardhatEthersSigner,
  minter: HardhatEthersSigner,
) => {
  const b3trToUpgrade = await nft.getB3TRtoUpgrade(tokenId)

  await b3tr.connect(minter).mint(owner.address, b3trToUpgrade)

  await b3tr.connect(owner).approve(await nft.getAddress(), b3trToUpgrade)

  await nft.connect(owner).upgrade(tokenId)
}

export const upgradeAndSelectNFTtoNextLevel = async (
  tokenId: number,
  nft: B3TRBadge,
  b3tr: B3TR,
  owner: HardhatEthersSigner,
  minter: HardhatEthersSigner,
) => {
  const b3trToUpgrade = await nft.getB3TRtoUpgrade(tokenId)

  await b3tr.connect(minter).mint(owner.address, b3trToUpgrade)

  await b3tr.connect(owner).approve(await nft.getAddress(), b3trToUpgrade)

  await nft.connect(owner).upgradeAndSelect(tokenId)
}
