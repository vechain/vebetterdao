import { ethers as _ethers } from "hardhat"

const b3trContractAddress = process.env.NEXT_PUBLIC_B3TR_CONTRACT_ADDRESS
if (!b3trContractAddress) throw new Error("B3TR_CONTRACT_ADDRESS is not set")

export const getB3trContractInstance = async () => {
  return ethers.getContractAt("B3TR", b3trContractAddress)
}

export const ethers = _ethers
