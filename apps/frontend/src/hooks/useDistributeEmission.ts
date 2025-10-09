import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { useWallet, currentBlockQueryKey } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getAllProposalsStateQueryKey } from "../api/contracts/governance/hooks/useAllProposalsState"
import { getProposalClaimableUserDepositsQueryKey } from "../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { getAllocationAmountQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationAmount"
import { getAllocationsRoundsEventsQueryKey } from "../api/contracts/xAllocations/hooks/useAllocationsRoundsEvents"
import {
  getCurrentAllocationsRoundIdQueryKey,
  useCurrentAllocationsRoundId,
} from "../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { getRoundXAppsQueryKey } from "../api/contracts/xApps/hooks/useRoundXApps"

import { useBuildTransaction } from "./useBuildTransaction"

import { buildClause } from "@/utils/buildClause"

const EmissionsInterface = Emissions__factory.createInterface()
type useDistributeEmissionsProps = {
  onSuccess?: () => void
}
/**
 * Hook to mint a certain amount of B3TR tokens
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useDistributeEmission = ({ onSuccess }: useDistributeEmissionsProps) => {
  const { account } = useWallet()
  const { data: currendRoundId } = useCurrentAllocationsRoundId()
  const clauseBuilder = useCallback(() => {
    if (!account?.address) throw new Error("Account is required")
    return [
      buildClause({
        to: getConfig().emissionsContractAddress,
        contractInterface: EmissionsInterface,
        method: "distribute",
        args: [],
        comment: "Distribute emissions",
      }),
    ]
  }, [account?.address])
  const refetchQueryKeys = useMemo(
    () => [
      getCurrentAllocationsRoundIdQueryKey(),
      getAllocationsRoundsEventsQueryKey(),
      currentBlockQueryKey(),
      getRoundXAppsQueryKey(currendRoundId ?? "0"),
      getAllocationAmountQueryKey(currendRoundId ?? "0"),
      getAllProposalsStateQueryKey(),
      getProposalClaimableUserDepositsQueryKey(account?.address ?? ""),
    ],
    [account?.address, currendRoundId],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
