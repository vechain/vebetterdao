import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/B3TR.sol/B3TR.json"
const b3trAbi = Contract.abi
import { FormattingUtils } from "@repo/utils"

const config = getConfig()
const B3TR_CONTRACT = config.b3trContractAddress
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 * Build the clause to mint B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildB3trApprovesVot3ContractTx = (
  thor: Connex.Thor,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = b3trAbi.find(e => e.name === "approve")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const formattedAddress = FormattingUtils.humanAddress(VOT3_CONTRACT)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(B3TR_CONTRACT).method(functionAbi).asClause(VOT3_CONTRACT, amountWithDecimals)

  return {
    ...clause,
    comment: `Approve ${formattedAddress} to transfer ${formattedAmount} B3TR`,
    abi: functionAbi,
  }
}
