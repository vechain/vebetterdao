import { getConfig } from "@repo/config"
import { GrantsManager__factory } from "@vechain/vebetterdao-contracts/factories/GrantsManager__factory"
import { getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"

const address = getConfig().grantsManagerContractAddress
const abi = GrantsManager__factory.abi
const method = "grantState" as const
/**
 * Returns the query key for fetching the grant proposal state.
 * Used for cache management in useAllProposalsState.
 * @param proposalId The proposal ID to get the grant state for
 * @returns The query key for fetching the grant proposal state.
 */
export const getGrantProposalStateQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })
