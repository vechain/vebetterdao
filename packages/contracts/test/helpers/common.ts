import { ethers } from "hardhat";
import { B3TR, GovernorContract } from "../../typechain-types";
import { BaseContract, ContractFactory, ContractTransactionResponse } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export const waitForNextBlock = async () => {
    // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
    let startingBlock = await ethers.provider.getBlockNumber()
    let currentBlock
    do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentBlock = await ethers.provider.getBlockNumber()
    } while (startingBlock === currentBlock)
}

export const createProposal = async (
    governor: GovernorContract,
    contractToCall: BaseContract,
    ContractFactory: ContractFactory,
    proposer: HardhatEthersSigner,
    description: string = "",
    functionTocall: string = "tokenDetails",
    values: number[] = [],
): Promise<ContractTransactionResponse> => {
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