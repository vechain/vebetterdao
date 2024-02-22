import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import {
  getHasXAppClaimed,
  getHasXAppClaimedQueryKey,
  getXAppClaimableAmount,
  getXAppClaimableAmountQueryKey,
} from "@/api"

const XAllocationPoolInterface = XAllocationPool__factory.createInterface()

type Props = {
  roundId: string
  appId: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

/**
 * Claim xApp allocation rewards for a specific round
 *
 * @param roundId
 * @param appId
 * @param onSuccess
 * @param invalidateCache
 * @returns
 */
export const useClaimXAppAllocation = ({
  roundId,
  appId,
  onSuccess,
  invalidateCache = true,
}: Props): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().xAllocationPoolContractAddress,
        value: 0,
        data: XAllocationPoolInterface.encodeFunctionData("claim", [roundId, appId]),
        comment: "Claiming allocation rewards for  round " + roundId,
        abi: JSON.parse(JSON.stringify(XAllocationPoolInterface.getFunction("claim"))),
      },
    ]

    return clauses
  }, [roundId, appId])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getXAppClaimableAmountQueryKey(roundId, appId),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppClaimableAmountQueryKey(roundId, appId),
      })
      await queryClient.cancelQueries({
        queryKey: getHasXAppClaimedQueryKey(roundId, appId),
      })
      await queryClient.refetchQueries({
        queryKey: getHasXAppClaimedQueryKey(roundId, appId),
      })
    }

    toast({
      title: "Allocation claimed successfully",
      description: `Alloaction rewards for round ${roundId} claimed successfully for xApp`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
