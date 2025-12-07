import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { getParticipatedInGovernanceQueryKey } from "@/api/contracts/galaxyMember/hooks/useParticipatedInGovernance"
import { getXAppRoundEarningsQueryKey } from "@/api/contracts/xAllocationPool/hooks/useXAppRoundEarnings"
import { getAllocationVotersQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVoters"
import { getAllocationVotesQueryKey } from "@/api/contracts/xAllocations/hooks/useAllocationVotes"
import { getHasVotedInRoundQueryKey } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { getUserVotingPreferencesQueryKey } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { getUserVotesInRoundQueryKey } from "@/api/contracts/xApps/hooks/useUserVotesInRound"
import { getXAppsSharesQueryKey } from "@/api/contracts/xApps/hooks/useXAppShares"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { useBuildTransaction } from "./useBuildTransaction"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress

type ClausesProps = {
  appIds: string[]
}

type UseUpdateVotingPreferencesProps = {
  roundId: string
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

/**
 * Hook to update voting preferences when auto-voting is already enabled
 * This handles Case 3: User has auto-voting on and wants to update their app preferences
 *
 * Operations:
 * 1. setUserVotingPreferences - update the app IDs for future auto-voting
 *
 * @param roundId - The current round ID
 * @param onSuccess - Optional callback to run when transaction succeeds
 * @param transactionModalCustomUI - Optional custom UI for the transaction modal
 * @returns Transaction builder hook with sendTransaction function
 */
export const useUpdateVotingPreferences = ({
  roundId,
  onSuccess,
  transactionModalCustomUI,
}: UseUpdateVotingPreferencesProps) => {
  const { account } = useWallet()
  const thor = useThor()

  const contract = thor.contracts.load(address, abi)

  const clauseBuilder = ({ appIds }: ClausesProps) => [
    contract.clause.setUserVotingPreferences(appIds, {
      comment: "Update voting preferences for auto-voting",
    }).clause,
  ]

  const refetchQueryKeys = useMemo(() => {
    return [
      getAllocationVotesQueryKey(roundId),
      getAllocationVotersQueryKey(roundId),
      getXAppsSharesQueryKey(roundId),
      getUserVotesInRoundQueryKey(roundId, account?.address ?? ""),
      getHasVotedInRoundQueryKey(roundId, account?.address ?? undefined),
      getXAppRoundEarningsQueryKey(roundId),
      getParticipatedInGovernanceQueryKey(account?.address ?? ""),
      getUserVotingPreferencesQueryKey(account?.address ?? ""),
    ]
  }, [roundId, account?.address])

  return useBuildTransaction<ClausesProps>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
