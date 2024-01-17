import B3tr from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
import { HttpClient, ThorClient } from "@vechain/vechain-sdk-network"
import { getConfig } from "@repo/config"
import { getTestKey } from "./pks"
import { logger } from "../../utils/Logger"
import { DeployParams } from "@vechain/vechain-sdk-core"

const config = getConfig()
const thorNetwork = new HttpClient(config.nodeUrl)
const thorClient = new ThorClient(thorNetwork)

let cachedB3tr: string | undefined = undefined

export const getOrDeployB3tr = async (minter: string, forceDeploy: boolean = false): Promise<string> => {
  if (!forceDeploy && cachedB3tr !== undefined) {
    return cachedB3tr
  }

  // Deploy the contract
  const key = getTestKey(0)
  const deployParams: DeployParams = { types: ["address"], values: [minter] }
  const transaction = await thorClient.contracts.deployContract(
    key.pk.toString("hex"),
    B3tr.bytecode + "000000000000000000000000435933c8064b4ae76be665428e0307ef2ccfbd68",
    deployParams,
  )

  // Wait for the receipt
  const receipt = await thorClient.transactions.waitForTransaction(transaction.id)

  if (!receipt || receipt.reverted) {
    logger.error(`Receipt: ${JSON.stringify(receipt)}`)
    throw new Error("B3tr contract deployment failed")
  }

  const address = receipt.outputs[0].contractAddress
  if (!address) throw new Error("B3tr contract deployment failed")

  cachedB3tr = address
  return address
}

export const getBalance = async (contractAddress: string, address: string): Promise<string> => {
  const bal = await thorClient.contracts.executeContractCall(contractAddress, B3tr.abi, "balanceOf", [address])
  const balArr = bal as string[]
  if (!balArr || balArr.length !== 1) throw new Error("Failed to get balance")
  return balArr[0]
}
