import { ethers } from "hardhat"
import { Stargate } from "../../typechain-types"
import { AddressLike } from "ethers"
import { SeedAccount } from "./seedAccounts"

/**
 * Add a Vechain Node token of a specific level to the owner
 * @param levelId - The level ID of the node
 * @param owner - The address of the owner
 * @param stargateMock - The StargateMock contract
 */
export const stakeVET = async (levelId: number, owner: AddressLike, stargateMock: Stargate): Promise<void> => {
  if (!stargateMock) throw new Error("StargateMock not found")

  const stargateNFTAddress = await stargateMock.stargateNFT()
  const stargateNFT = await ethers.getContractAt("IStargateNFT", stargateNFTAddress)

  const level = await stargateNFT.getLevel(levelId)
  if (!level) throw new Error("Level not found")

  await stargateMock.stake(levelId, { value: level.vetAmountRequiredToStake })
}

/**
 * Mint Stargate NFTs for a list of accounts
 * @param vechainNodes - The VechainNodesMock contract
 * @param accounts - The list of accounts
 */
export const mintStargateNFTs = async (
  stargateMock: Stargate,
  accounts: SeedAccount[],
  levels: number[],
): Promise<void> => {
  for (let i = 0; i < accounts.length; i++) {
    await stakeVET(levels[i], accounts[i].key.address.toString(), stargateMock)
  }
}
