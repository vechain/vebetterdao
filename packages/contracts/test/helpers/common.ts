import { ethers } from "hardhat";

export const waitForNextBlock = async () => {
    // since we do not support ethers' evm_mine yet, we need to wait for a block with a timeout function
    let startingBlock = await ethers.provider.getBlockNumber()
    let currentBlock
    do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        currentBlock = await ethers.provider.getBlockNumber()
    } while (startingBlock === currentBlock)
}