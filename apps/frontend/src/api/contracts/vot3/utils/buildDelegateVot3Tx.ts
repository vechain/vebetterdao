import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/VOT3.sol/VOT3.json"
import { FormattingUtils } from "@repo/utils"

const abi = Contract.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to delegate votes to the given address (used to delegate votes to the governance contract)
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @returns the clause to delegate votes
 */
export const buildDelegateVot3Tx = (thor: Connex.Thor, address: string): Connex.Vendor.TxMessage[0] => {
  const functionAbi = abi.find(e => e.name === "delegate")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(address)

  const formattedAddress = FormattingUtils.humanAddress(address)

  return {
    ...clause,
    comment: `Delegate VOT£ to ${formattedAddress}`,
    abi: functionAbi,
  }
}
