import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"
import { getIsRoundFinalizedQueryKey } from "@/api"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type Props = {
  roundId: string
  onSuccess?: () => void
  invalidateCache?: boolean
}

/**
 * Allow xApp to claim allocation rewards for a specific round
 *
 * @param roundId
 * @param onSuccess
 * @param invalidateCache
 * @returns
 */
export const useFinalizeRound = ({
  roundId,
  onSuccess,
  invalidateCache = true,
}: Props): UseSendTransactionReturnValue => {
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().xAllocationVotingContractAddress,
        value: 0,
        data: XAllocationVotingInterface.encodeFunctionData("finalize", [roundId]),
        comment: "Finalize round " + roundId,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("finalize"))),
      },
    ]

    return clauses
  }, [roundId])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getIsRoundFinalizedQueryKey(roundId),
      })
      await queryClient.refetchQueries({
        queryKey: getIsRoundFinalizedQueryKey(roundId),
      })
    }

    toast({
      title: "Operation completed successfully",
      description: `Round finalized, users xapps can now claim their allocations`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, roundId])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
