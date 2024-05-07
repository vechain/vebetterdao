import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"

import { Vot3ContractJson } from "@repo/contracts"
const vot3Abi = Vot3ContractJson.abi

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to convert B3TR tokens to VOT3 for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to convert
 * @param decimals the decimals of the token
 * @returns the clause to convert B3TR to VOT3
 */
export const buildConvertB3trTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = vot3Abi.find(e => e.name === "convertToVOT3")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals, decimals)

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Convert ${formattedAmount} B3TR to VOT3`,
    abi: functionAbi,
  }
}
