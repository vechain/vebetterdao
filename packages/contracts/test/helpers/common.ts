import { ethers, network } from "hardhat"
import { Emissions, GovernorContract } from "../../typechain-types"
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers"
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers"
import { getOrDeployContractInstances } from "./deploy"
import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { BLOCK_INTERVAL } from "./const"

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

  const tx = await governor.connect(proposer).propose([address], [0], [encodedFunctionCall], description)

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

export const waitForVotingPeriodToEnd = async (proposalId: number, governor: GovernorContract) => {
  const deadline = await governor.proposalDeadline(proposalId)

  const currentBlock = await governor.clock()

  await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}

export const waitForProposalToBeActive = async (proposalId: number, governor: GovernorContract): Promise<bigint> => {
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

export const waitUntilTimestamp = async (timestamp: number) => {
  const currentBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber())

  if (!currentBlock?.timestamp) throw new Error("Could not get current block timestamp")

  if (currentBlock?.timestamp < timestamp) {
    // Get blocks required to wait
    const blocksToWait = Math.floor((timestamp - currentBlock?.timestamp) / BLOCK_INTERVAL + 1)

    if (blocksToWait > 0)
      await moveBlocks(network.name === "hardhat" ? timestamp - currentBlock?.timestamp + 1 : blocksToWait)
  }
}

export const waitForNextCycle = async (emissions: Emissions) => {
  const nextCycle = await emissions.nextCycle()
  const timestampNextCycle = await emissions.getTimestampCycleStart(nextCycle)

  await waitUntilTimestamp(Number(timestampNextCycle))
}

export const moveToCycle = async (emissions: Emissions, minter: HardhatEthersSigner, cycles: number) => {
  for (let i = 0; i < cycles; i++) {
    await waitForNextCycle(emissions)
    await emissions.connect(minter).distribute()
  }
}
