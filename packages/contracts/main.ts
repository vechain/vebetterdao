import { ethers } from "ethers"
import { abi as b3trAbi } from "./artifacts/contracts/B3TR.sol/B3TR.json"
import { B3TR } from "./typechain-types"

export const getB3trContractInstance = async (contractAddress: string): Promise<B3TR> => {
  return new ethers.Contract(contractAddress, b3trAbi) as unknown as B3TR
}
