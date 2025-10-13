import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VOT3__factory } from "@vechain/vebetterdao-contracts"
import { EnhancedClause, ThorClient } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const abi = VOT3__factory.abi
const contractAddress = getConfig().vot3ContractAddress
/**
 * Build the clause to convert VOT3 tokens to B3TR for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to convert to B3TR
 * @param decimals the decimals of the token
 * @returns the clause to convert VOT3 to B3TR
 */
export const buildConvertVot3Tx = (thor: ThorClient, amount: string | number): EnhancedClause => {
  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = ethers.parseEther(amount.toString()).toString()
  const { clause } = thor.contracts.load(contractAddress, abi).clause.convertToB3TR(amountWithDecimals)
  return {
    ...clause,
    comment: `Convert ${formattedAmount} VOT3 to B3TR`,
  }
}
