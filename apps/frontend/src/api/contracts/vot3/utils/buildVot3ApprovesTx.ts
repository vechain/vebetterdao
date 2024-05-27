import { getConfig } from "@repo/config"
import { AddressUtils, FormattingUtils } from "@repo/utils"
import { Vot3ContractJson } from "@repo/contracts"
const vot3Abi = Vot3ContractJson.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to mint VOT3 tokens for the given address and amount
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param spender the address to approve to spend the tokens
 * @param decimals the decimals of the token
 * @returns the clause to mint VOT3 tokens
 */
export const buildVot3ApprovesTx = (
  thor: Connex.Thor,
  amount: string | number,
  spender: string,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = vot3Abi.find(e => e.name === "approve")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  if (AddressUtils.isValid(spender) === false) throw new Error("Invalid spender address")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const formattedAddress = FormattingUtils.humanAddress(spender)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(spender, amountWithDecimals)

  return {
    ...clause,
    comment: `Approve ${formattedAddress} to transfer ${formattedAmount} VOT3`,
    abi: functionAbi,
  }
}
