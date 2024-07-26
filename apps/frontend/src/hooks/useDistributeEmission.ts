import {
  getCurrentAllocationsRoundIdQueryKey,
  getAllocationsRoundsEventsQueryKey,
  currentBlockQueryKey,
  useCurrentAllocationsRoundId,
  getRoundXAppsQueryKey,
  getAllocationAmountQueryKey,
} from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { Emissions__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const EmissionsInterface = Emissions__factory.createInterface()

type useDistributeEmissionsProps = {
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to mint a certain amount of B3TR tokens
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useDistributeEmission = ({
  onSuccess,
  invalidateCache = true,
}: useDistributeEmissionsProps): UseSendTransactionReturnValue => {
  const { account } = useWallet()
  const { data: currendRoundId } = useCurrentAllocationsRoundId()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().emissionsContractAddress,
        value: 0,
        data: EmissionsInterface.encodeFunctionData("distribute"),
        comment: "Distribute emissions",
        abi: JSON.parse(JSON.stringify(EmissionsInterface.getFunction("distribute"))),
      },
    ]

    return clauses
  }, [])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getCurrentAllocationsRoundIdQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getCurrentAllocationsRoundIdQueryKey(),
      })
      await queryClient.cancelQueries({
        queryKey: getAllocationsRoundsEventsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getAllocationsRoundsEventsQueryKey(),
      })

      await queryClient.cancelQueries({
        queryKey: currentBlockQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: currentBlockQueryKey(),
      })

      await queryClient.cancelQueries({
        queryKey: getRoundXAppsQueryKey(currendRoundId ?? "0"),
      })
      await queryClient.refetchQueries({
        queryKey: getRoundXAppsQueryKey(currendRoundId ?? "0"),
      })

      await queryClient.cancelQueries({
        queryKey: getAllocationAmountQueryKey(currendRoundId ?? "0"),
      })
      await queryClient.refetchQueries({
        queryKey: getAllocationAmountQueryKey(currendRoundId ?? "0"),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess, currendRoundId])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
