import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { B3trContractJson } from "@repo/contracts"
const b3trAbi = B3trContractJson.abi

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
export const buildMintB3trTx = (
  thor: Connex.Thor,
  address: string,
  amount: string | number,
  decimals = 18,
): Connex.Vendor.TxMessage[0] => {
  const functionAbi = b3trAbi.find(e => e.name === "mint")
  if (!functionAbi) throw new Error("Function abi not found for mint")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const formattedAddress = FormattingUtils.humanAddress(address)
  const amountWithDecimals = FormattingUtils.scaleNumberUp(amount, decimals)

  const clause = thor.account(B3TR_CONTRACT).method(functionAbi).asClause(address, amountWithDecimals)

  return {
    ...clause,
    comment: `Mint ${formattedAmount} B3TR to ${formattedAddress}`,
    abi: functionAbi,
  }
}
