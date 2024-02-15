import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"

import { Vot3ContractJson } from "@repo/contracts"
const vot3Abi = Vot3ContractJson.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to stake B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildStakeB3trTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = vot3Abi.find(e => e.name === "stake")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Stake ${formattedAmount} B3TR`,
    abi: functionAbi,
  }
}
