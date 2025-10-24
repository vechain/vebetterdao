import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VOT3__factory } from "@vechain/vebetterdao-contracts/factories/VOT3__factory"
import { EnhancedClause, ThorClient } from "@vechain/vechain-kit"
import { ethers } from "ethers"

const config = getConfig()
const abi = VOT3__factory.abi
const VOT3_CONTRACT = config.vot3ContractAddress
/**
 * Build the clause to convert B3TR tokens to VOT3 for the given address and amount
 * @param thor thor instance
 * @param amount the amount of tokens to convert
 * @param decimals the decimals of the token
 * @returns the clause to convert B3TR to VOT3
 */
export const buildConvertB3trTx = (thor: ThorClient, amount: string | number): EnhancedClause => {
  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const amountWithDecimals = ethers.parseEther(amount.toString()).toString()
  const { clause } = thor.contracts.load(VOT3_CONTRACT, abi).clause.convertToVOT3(amountWithDecimals)
  return {
    ...clause,
    comment: `Convert ${formattedAmount} B3TR to VOT3`,
  }
}
