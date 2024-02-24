import { getB3trBadgeBalanceQueryKey, getTokenIdByAccountQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { EnhancedClause } from "@/hooks"
import { getConfig } from "@repo/config"

import { B3TRBadge__factory } from "@repo/contracts"

const B3trBadgeInterface = B3TRBadge__factory.createInterface()

type useClaimNFTProps = {
  onSuccess?: () => void
  onFailure?: () => void
  invalidateCache?: boolean
}

type useClaimNFTReturnValue = {
  sendTransaction: () => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Hook to claim an NFT
 * @param onSuccess callback to call when the NFT is successfully claimed
 * @returns the result of the transaction
 */
export const useClaimNFT = ({
  onSuccess,
  onFailure,
  invalidateCache = true,
}: useClaimNFTProps): useClaimNFTReturnValue => {
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback((): EnhancedClause[] => {
    return [
      {
        to: getConfig().nftBadgeContractAddress,
        value: 0,
        data: B3trBadgeInterface.encodeFunctionData("freeMint"),
        comment: `Claim NFT`,
        abi: JSON.parse(JSON.stringify(B3trBadgeInterface.getFunction("freeMint"))),
      },
    ]
  }, [])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.refetchQueries({
        queryKey: getTokenIdByAccountQueryKey(account),
      })
      await queryClient.refetchQueries({
        queryKey: getB3trBadgeBalanceQueryKey(account),
      })
    }

    toast({
      title: "Galaxy Member Badge Claimed",
      description: `You have correctly claimed your GM Badge!`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })

    onSuccess?.()
  }, [queryClient, toast, account])

  const handleOnFailure = useCallback(() => {
    onFailure?.()
  }, [toast, onFailure])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
    onTxFailedOrCancelled: handleOnFailure,
  })

  const onMutate = useCallback(async () => {
    const clauses = buildClauses()
    return result.sendTransaction(clauses)
  }, [buildClauses, result])

  return { ...result, sendTransaction: onMutate }
}
