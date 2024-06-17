import { getCurrentAllocationsRoundIdQueryKey, getAllocationsRoundsEventsQueryKey, currentBlockQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { Emissions__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const EmissionsInterface = Emissions__factory.createInterface()

type useStartEmissionsProps = {
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to start the emissions
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useStartEmission = ({
  onSuccess,
  invalidateCache = true,
}: useStartEmissionsProps): UseSendTransactionReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().emissionsContractAddress,
        value: 0,
        data: EmissionsInterface.encodeFunctionData("start"),
        comment: "Start emissions",
        abi: JSON.parse(JSON.stringify(EmissionsInterface.getFunction("start"))),
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
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
