import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { Vot3ContractJson } from "@repo/contracts"
import { ethers } from "ethers"

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to convert VOT3 tokens to B3TR for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to convert to B3TR
 * @param decimals the decimals of the token
 * @returns the clause to convert VOT3 to B3TR
 */
export const buildConvertVot3Tx = (thor: Connex.Thor, amount: string | number): Connex.Vendor.TxMessage[0] => {
  const functionAbi = Vot3ContractJson.abi.find(e => e.name === "convertToB3TR")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = ethers.parseEther(amount.toString()).toString()

  const clause = thor.account(VOT3_CONTRACT).method(functionAbi).asClause(amountWithDecimals)

  return {
    ...clause,
    comment: `Convert ${formattedAmount} VOT3 to B3TR`,
    abi: functionAbi,
  }
}
