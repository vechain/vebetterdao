import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getProposalClaimableUserDepositsQueryKey } from "../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { getProposalUserDepositQueryKey } from "../api/contracts/governance/hooks/useProposalUserDeposit"
import { getDepositsVotesOnBlockPrefixQueryKey } from "../api/contracts/governance/hooks/useTotalVotesOnBlock"
import { getVotesOnBlockPrefixQueryKey } from "../api/contracts/governance/hooks/useVotesOnBlock"
import { ProposalDeposit, buildClaimDepositsTx } from "../api/contracts/governance/utils/buildClaimDepositsTx"

import { useBuildTransaction } from "./useBuildTransaction"
import { getVot3BalanceQueryKey } from "./useGetVot3Balance"
import { getVot3UnlockedBalanceQueryKey } from "./useGetVot3UnlockedBalance"

/**
 * Type definition for properties accepted by the `useWithdrawDeposits` hook.
 */
type useClaimRewardsProps = {
  proposalDeposits: ProposalDeposit[]
  onSuccess?: () => void
  onFailure?: () => void
  onSuccessMessageTitle?: string
}
/**
 * A custom React hook that enables a user to withdraw deposits associated with proposals.
 * The hook provides functionality to send transactions for withdrawing deposits and to optionally
 * invalidate and refresh related data in the cache upon successful transaction confirmation.
 *
 * @param proposalDeposits - An array of `ProposalDeposit` that specifies the deposits to withdraw.
 * @param onSuccess - Optional callback to be executed upon successful transaction confirmation.
 * @param onFailure - Optional callback to be executed if the transaction fails or is cancelled.
 * @param invalidateCache - Flag to determine whether to invalidate and refresh the related cache. Defaults to true.
 * @returns An object containing functions and properties for transaction management.
 */
export const useWithdrawDeposits = ({ proposalDeposits, onSuccess, onFailure }: useClaimRewardsProps) => {
  const { account } = useWallet()
  const buildClauses = useCallback(() => {
    if (!account?.address) throw new Error("address is required")
    const clauses = buildClaimDepositsTx(proposalDeposits, account?.address ?? "")
    return clauses
  }, [account?.address, proposalDeposits])
  const refetchQueryKeys = useMemo(() => {
    const queryKeys = proposalDeposits.map(proposalDeposit =>
      getProposalUserDepositQueryKey(proposalDeposit.proposalId, account?.address ?? ""),
    )
    queryKeys.push(getProposalClaimableUserDepositsQueryKey(account?.address ?? ""))
    queryKeys.push(getVot3BalanceQueryKey(account?.address ?? ""))
    queryKeys.push(getVot3UnlockedBalanceQueryKey(account?.address ?? ""))
    queryKeys.push(getDepositsVotesOnBlockPrefixQueryKey())
    queryKeys.push(getVotesOnBlockPrefixQueryKey())
    queryKeys.push(["bestBlockCompressed"])
    return queryKeys
  }, [account, proposalDeposits])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    onSuccess,
    refetchQueryKeys,
    onFailure,
  })
}
