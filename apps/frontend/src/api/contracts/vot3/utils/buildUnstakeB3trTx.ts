import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"

import { Vot3ContractJson } from "@repo/contracts"

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to unstake B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildUnstakeStakeB3trTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = Vot3ContractJson.abi.find(e => e.name === "unstake")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Unstake ${formattedAmount} B3TR`,
    abi: functionAbi,
  }
}
