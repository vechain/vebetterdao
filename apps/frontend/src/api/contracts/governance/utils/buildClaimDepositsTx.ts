import { EnhancedClause } from "@vechain/vechain-kit"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"

/**
 * Retrieves the contract interface of the B3TRGovernor.
 */
const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Retrieves the contract address for the B3TRGovernor from the configuration.
 */
const GOVERNOR_ADDRESS = getConfig().b3trGovernorAddress

/**
 * Defines the structure for storing proposal deposit information.
 */
export interface ProposalDeposit {
  proposalId: string
  deposit: string
}

/**
 * Constructs a transaction to claim deposits from multiple proposals.
 * This function iterates over an array of `ProposalDeposit`, constructing
 * transaction clauses for each valid deposit entry where the deposit amount is greater than zero.
 *
 * @param proposalDeposits - Array of `ProposalDeposit` containing details about each deposit to be claimed.
 * @param address - The Ethereum address of the claimant.
 * @returns An array of `Connex.Vendor.TxMessage` representing the transaction clauses needed to claim the deposits.
 */
export const buildClaimDepositsTx = (proposalDeposits: ProposalDeposit[], address: string): EnhancedClause[] => {
  const clauses = []

  for (const deposit of proposalDeposits) {
    if (!deposit || Number(deposit.deposit) <= 0) continue

    const clause: EnhancedClause = buildClause({
      contractInterface: governorInterface,
      to: GOVERNOR_ADDRESS,
      method: "withdraw",
      args: [deposit.proposalId, address],
      comment: `Withdraw deposited vot3 of proposal ${deposit.proposalId}`,
    })

    clauses.push(clause)
  }

  return clauses
}
