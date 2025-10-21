import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts"
import { useWallet, EnhancedClause } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

import { getIsAutoVotingEnabledQueryKey } from "../api/contracts/xAllocations/hooks/useIsAutoVotingEnabled"
import { getUserVotingPreferencesQueryKey } from "../api/contracts/xAllocations/hooks/useUserVotingPreferences"

import { useBuildTransaction } from "./useBuildTransaction"

type UpdateAutomationPreferencesProps = {
  appIds: string[]
  toggleAutomation: boolean
  userAddress: string
}

type useUpdateAutomationPreferencesHookProps = {
  onSuccess?: () => void
  transactionModalCustomUI?: TransactionCustomUI
}

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

/**
 * Hook to update automation preferences (app selections and auto-voting toggle)
 * This hook will send transactions to update user preferences without casting a vote
 * @param onSuccess callback to run when the update is successful
 * @param transactionModalCustomUI custom UI for the transaction modal
 */
export const useUpdateAutomationPreferences = ({
  onSuccess,
  transactionModalCustomUI,
}: useUpdateAutomationPreferencesHookProps) => {
  const { account } = useWallet()

  const buildClauses = useCallback((data: UpdateAutomationPreferencesProps) => {
    const clauses: EnhancedClause[] = []

    // 1. Update app preferences if provided
    if (data.appIds.length > 0) {
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("setUserVotingPreferences", [data.appIds]),
        comment: "Update voting preferences",
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("setUserVotingPreferences"))),
      })
    }

    // 2. Toggle auto voting if requested
    if (data.toggleAutomation) {
      clauses.push({
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("toggleAutoVoting", [data.userAddress]),
        comment: "Toggle automatic voting",
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("toggleAutoVoting"))),
      })
    }

    return clauses
  }, [])

  const refetchQueryKeys = useMemo(() => {
    return [
      getIsAutoVotingEnabledQueryKey(account?.address ?? ""),
      getUserVotingPreferencesQueryKey(account?.address ?? ""),
    ]
  }, [account?.address])

  return useBuildTransaction({
    clauseBuilder: buildClauses,
    // @ts-ignore
    refetchQueryKeys,
    onSuccess,
    transactionModalCustomUI,
  })
}
