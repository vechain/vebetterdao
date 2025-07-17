import { getConfig } from "@repo/config"
import { AddressUtils, FormattingUtils } from "@repo/utils"
import { B3TR__factory } from "@repo/contracts"
import { ethers } from "ethers"
import { EnhancedClause, ThorClient } from "@vechain/vechain-kit"

const abi = B3TR__factory.abi
const address = getConfig().b3trContractAddress

/**
 * Build the clause to mint B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param spender the address to approve to spend the tokens
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildB3trApprovesTx = (thor: ThorClient, amount: string | number, spender: string): EnhancedClause => {
  if (AddressUtils.isValid(spender) === false) throw new Error("Invalid spender address")

  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const formattedAddress = FormattingUtils.humanAddress(spender)
  const amountWithDecimals = ethers.parseEther(amount.toString()).toString()

  const { clause } = thor.contracts.load(address, abi).clause.approve(spender, amountWithDecimals)

  return {
    ...clause,
    comment: `Approve ${formattedAddress} to transfer ${formattedAmount} B3TR`,
  }
}
