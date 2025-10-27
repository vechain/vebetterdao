import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VOT3__factory } from "@vechain/vebetterdao-contracts/factories/VOT3__factory"
import { EnhancedClause, ThorClient } from "@vechain/vechain-kit"

const abi = VOT3__factory.abi
const contractAddress = getConfig().vot3ContractAddress
/**
 * Build the clause to delegate votes to the given address (used to delegate votes to the governance contract)
 * @param thor thor instance
 * @param address the address to mint the tokens to
 * @returns the clause to delegate votes
 */
export const buildDelegateVot3Tx = (thor: ThorClient, address: string): EnhancedClause => {
  const formattedAddress = FormattingUtils.humanAddress(address)
  const { clause } = thor.contracts.load(contractAddress, abi).clause.delegate(address)
  return {
    ...clause,
    comment: `Delegate VOT£ to ${formattedAddress}`,
  }
}
