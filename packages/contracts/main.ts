import { ethers as _ethers } from "hardhat"
import { HardhatEthersHelpers } from "hardhat/types"
import { B3TR } from "./typechain-types"

const b3trContractAddress = process.env.NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS
if (!b3trContractAddress) throw new Error("B3TR_CONTRACT_ADDRESS is not set")

export const getB3trContractInstance = async () => {
    const B3tr = await ethers.getContractAt("B3TR", b3trContractAddress)
    return B3tr as B3TR
}

export const ethers = _ethers as typeof _ethers & HardhatEthersHelpers
