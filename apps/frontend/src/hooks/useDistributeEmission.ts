import {
  getCurrentAllocationsRoundIdQueryKey,
  getAllocationsRoundsEventsQueryKey,
  useCurrentAllocationsRoundId,
  getAllocationAmountQueryKey,
  getAllProposalsStateQueryKey,
  getProposalClaimableUserDepositsQueryKey,
  getRoundXAppsQueryKey,
} from "@/api"
import { useCallback, useMemo } from "react"
import { useWallet, currentBlockQueryKey } from "@vechain/vechain-kit"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { getConfig } from "@repo/config"
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
