import { ethers, network } from "hardhat"
import { Emissions, GovernorContract, XAllocationPool, XAllocationVoting } from "../../typechain-types"
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { getOrDeployContractInstances } from "./deploy"
import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { filterEventsByName, parseAlloctionProposalCreatedEvent } from "./events"

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
  governor: GovernorContract,
  contractToCall: BaseContract,
  ContractFactory: ContractFactory,
  proposer: HardhatEthersSigner,
  description: string = "",
  functionTocall: string = "tokenDetails",
  values: number[] = [],
  avoidMintingAndDelegating: boolean = false, // in some scenarios we want the operation to fail if the proposer does not have enough VOT3
): Promise<ContractTransactionResponse> => {
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

  const tx = await governor
    .connect(proposer)
    .propose([address], [0], [encodedFunctionCall], description, { gasLimit: 10_000_000 })

  return tx
}

export const getProposalIdFromTx = async (tx: ContractTransactionResponse, governor: GovernorContract) => {
  const proposeReceipt = await tx.wait()
  const event = proposeReceipt?.logs[0]
  const decodedLogs = governor.interface.parseLog({
    topics: [...(event?.topics as string[])],
    data: event ? event.data : "",
  })

  return decodedLogs?.args[0]
}

export const waitForVotingPeriodToEnd = async (proposalId: number, governor: GovernorContract | XAllocationVoting) => {
  const deadline = await governor.proposalDeadline(proposalId)

  const currentBlock = await governor.clock()

  await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}

export const waitForProposalToBeActive = async (
  proposalId: number,
  governor: GovernorContract | XAllocationVoting,
): Promise<bigint> => {
  let proposalState = await governor.state(proposalId) // proposal id of the proposal in the beforeAll step

  if (proposalState.toString() !== "1") {
    const currentBlock = await governor.clock() // Or ethers.provider.getBlockNumber()
    const proposalSnapshot = await governor.proposalSnapshot(proposalId) // Block of when the proposal is active for voting. The next block is when the proposal is active

    const blocksToMove = parseInt((proposalSnapshot - currentBlock + BigInt(1)).toString()) // Blocks to wait until the proposal is active
    await moveBlocks(blocksToMove)

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
  governor: GovernorContract,
  contractToCall: BaseContract,
  Contract: ContractFactory,
  description: string,
  functionToCall: string,
  args: any[] = [],
) => {
  // load votes
  // console.log("Loading votes");
  await getVot3Tokens(voter, "1000")
  await waitForNextBlock()

  // create a new proposal
  // console.log("Creating proposal");
  const tx = await createProposal(governor, contractToCall, Contract, proposer, description, functionToCall, args)
  const proposalId = await getProposalIdFromTx(tx, governor)

  // wait
  // console.log("Waiting for voting period to start");
  await waitForProposalToBeActive(proposalId, governor)

  // vote
  // console.log("Voting");
  await governor.connect(voter).castVote(proposalId, 1, { gasLimit: 10_000_000 }) // vote for

  // wait
  // console.log("Waiting for voting period to end");
  await waitForVotingPeriodToEnd(proposalId, governor)

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
  governor: GovernorContract,
  xAllocationVoting: XAllocationVoting,
  appName: string = "Bike 4 Life" + Math.random(),
  appAddress: string,
  appMetadata: string = "",
) => {
  await createProposalAndExecuteIt(
    proposer,
    voter,
    governor,
    xAllocationVoting,
    await ethers.getContractFactory("XAllocationVoting"),
    "Add app to the list",
    "addApp",
    [appAddress, appName, appMetadata],
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

export const waitForNextCycle = async (emissions: Emissions) => {
  const nextCycle = await emissions.nextCycle()
  const blockNextCycle = await emissions.getCycleBlock(nextCycle)

  await waitForBlock(Number(blockNextCycle))
}

export const moveToCycle = async (emissions: Emissions, minter: HardhatEthersSigner, cycle: number) => {
  const cycleToBeDistributed = await emissions.nextCycle()
  for (let i = 0; i <= BigInt(cycle) - cycleToBeDistributed; i++) {
    await waitForNextCycle(emissions)
    await emissions.connect(minter).distribute()
  }
}

export const voteOnApps = async (
  xAllocationVoting: XAllocationVoting,
  apps: string[],
  voters: HardhatEthersSigner[],
  votes: Array<Array<bigint>>,
  proposalId: bigint,
) => {
  for (const voter of voters) {
    await xAllocationVoting.connect(voter).castVote(proposalId, apps, votes[voters.indexOf(voter)])
  }
}

export const addAppsToAllocationVoting = async (
  xAllocationVoting: XAllocationVoting,
  apps: string[],
  owner: HardhatEthersSigner,
) => {
  let appIds: string[] = []
  for (const app of apps) {
    await xAllocationVoting.connect(owner).addApp(app, app, "")
    appIds.push(ethers.keccak256(ethers.toUtf8Bytes(app)))
  }

  return appIds
}

export const startNewAllocationRound = async (xAllocationVoting: XAllocationVoting) => {
  let tx = await xAllocationVoting.proposeNewAllocationRound()
  let receipt = await tx.wait()
  if (!receipt) throw new Error("No receipt")

  let { proposalId: roundId } = parseAlloctionProposalCreatedEvent(
    filterEventsByName(receipt.logs, "AllocationProposalCreated")[0],
    xAllocationVoting,
  )

  return roundId
}

export const calculateBaseAllocationOffChain = async (
  roundId: number,
  emissions: Emissions,
  xAllocationVoting: XAllocationVoting,
  xAllocationPool: XAllocationPool,
) => {
  let totalAmount
  // if it's the first cycle then the amount available is the first custom allocation
  if (roundId == 1) {
    totalAmount = (await emissions.getPreMintAllocations())[0]
  } else if (await emissions.isLastCycleId(roundId)) {
    // if it's the last cycle then the amount available is the last custom allocation
    totalAmount = await emissions.getLastXAllocationsAmount()
  } else {
    // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
    totalAmount = await emissions.getXAllocationAmountForCycle(roundId)
  }

  let elegibleApps = await xAllocationVoting.appsElegibleForVoting(roundId)

  const baseAllcoationPercentage = await xAllocationPool.baseAllocationPercentage()

  let remaining = (totalAmount * baseAllcoationPercentage) / BigInt(100)

  let amountPerApp = remaining / BigInt(elegibleApps.length)

  return amountPerApp
}

export const calculateVariableAppAllocationOffCahain = async (
  roundId: number,
  appId: string,
  emissions: Emissions,
  xAllocationPool: XAllocationPool,
) => {
  // uint256 allocationAmount = _emissionAmount(roundId);
  let totalAmount
  // if it's the first cycle then the amount available is the first custom allocation
  if (roundId == 1) {
    totalAmount = (await emissions.getPreMintAllocations())[0]
  } else if (await emissions.isLastCycleId(roundId)) {
    // if it's the last cycle then the amount available is the last custom allocation
    totalAmount = await emissions.getLastXAllocationsAmount()
  } else {
    // Amount available for this round (assuming the amount is already scaled by 1e18 for precision)
    totalAmount = await emissions.getXAllocationAmountForCycle(roundId)
  }

  let totalAvailable = (totalAmount * (await xAllocationPool.variableAllocationPercentage())) / BigInt(100)

  let appShares = (await xAllocationPool.getAppShares(roundId, appId)) / BigInt(100)

  return (totalAvailable * appShares) / BigInt(100)
}
