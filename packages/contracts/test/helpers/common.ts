import { ethers, network } from "hardhat";
import { B3TR, GovernorContract } from "../../typechain-types";
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { getOrDeployContractInstances } from "./deploy";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

export const waitForNextBlock = async () => {
    if (network.name === "hardhat") {
        await mine(1)
        return
    }

    // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
    let startingBlock = await ethers.provider.getBlockNumber()
    let currentBlock
    do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentBlock = await ethers.provider.getBlockNumber()
    } while (startingBlock === currentBlock)
}

export const moveBlocks = async (blocks: number) => {
    for (let i = 0; i < blocks; i++) {
        // console.log(`Moving to block +${i+1}`);
        await waitForNextBlock()
    }
}

export const mintAndDelegate = async (receiver: HardhatEthersSigner, amount: string) => {
    const { b3tr, vot3, minterAccount } = await getOrDeployContractInstances(false)

    await b3tr.connect(minterAccount).mint(receiver, ethers.parseEther(amount))
    await b3tr.connect(receiver).approve(await vot3.getAddress(), ethers.parseEther(amount))
    await vot3.connect(receiver).stake(ethers.parseEther(amount))
    // then we need to delegate the votes to ourself (self-delegation)
    // this needs to be done because by default voting power is calculated only when you delegate
    await vot3.connect(receiver).delegate(await receiver.getAddress())
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
    const proposerVotes = await governor.getVotes(proposer, (clock - BigInt(1)))
    const votesThreshold = await governor.proposalThreshold()

    if (votesThreshold > proposerVotes && !avoidMintingAndDelegating) {
        //The proposer needs to have some delegated VOT3 to be able to create a proposal
        await mintAndDelegate(proposer, (votesThreshold + BigInt(1)).toString())
        // We also need to wait a block to update the proposer's votes snapshot
        await waitForNextBlock()
    }

    const address = await contractToCall.getAddress()
    const encodedFunctionCall = ContractFactory.interface.encodeFunctionData(functionTocall, values)

    const tx = await governor.connect(proposer).propose(
        [address],
        [0],
        [encodedFunctionCall],
        description,
    )

    return tx
}

export const getProposalIdFromTx = async (tx: ContractTransactionResponse, governor: GovernorContract) => {
    const proposeReceipt = await tx.wait()
    const event = proposeReceipt?.logs[0]
    const decodedLogs = governor.interface.parseLog({
        topics: [...(event?.topics as string[])],
        data: event ? event.data : "",
    });

    return decodedLogs?.args[0]
}

export const waitForVotingPeriodToStart = async (proposalId: number, governor: GovernorContract) => {
    // wait for the proposal to be in active state
    const voteDealy = await governor.votingDelay()
    const blocksToMove = parseInt((voteDealy + BigInt(1)).toString())
    await moveBlocks(blocksToMove)
}

export const waitForVotingPeriodToEnd = async (proposalId: number, governor: GovernorContract) => {
    const deadline = await governor.proposalDeadline(proposalId)
    // console.log(`Waiting for proposal ${proposalId} to end at block ${deadline}`);

    const currentBlock = await governor.clock()
    // console.log(`Current block is ${currentBlock}`);


    await moveBlocks(parseInt((deadline - currentBlock + BigInt(1)).toString()))
}