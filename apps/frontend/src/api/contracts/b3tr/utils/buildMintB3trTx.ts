import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { B3TR__factory } from "@vechain-kit/vebetterdao-contracts"
import { ethers } from "ethers"
import { EnhancedClause, ThorClient } from "@vechain/vechain-kit"

const abi = B3TR__factory.abi
const contractAddress = getConfig().b3trContractAddress

/**
 * Build the clause to mint B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @param amount the amount of tokens to mint. Should not already include decimals
 * @param decimals the decimals of the token
 * @returns the clause to mint B3TR tokens
 */
export const buildMintB3trTx = (thor: ThorClient, address: string, amount: string | number): EnhancedClause => {
  const formattedAmount = FormattingUtils.humanNumber(amount ?? 0, amount)
  const formattedAddress = FormattingUtils.humanAddress(address)
  const amountWithDecimals = ethers.parseEther(amount.toString()).toString()

  const { clause } = thor.contracts.load(contractAddress, abi).clause.mint(address, amountWithDecimals)

  return {
    ...clause,
    comment: `Mint ${formattedAmount} B3TR to ${formattedAddress}`,
  }
}
