import { getB3trBadgeBalanceQueryKey, getParticipatedInGovernanceQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { buildClaimNftTx } from "@/api/contracts/b3trBadge/utils"

/**
 * Hook to claim an NFT
 * @param onSuccess callback to call when the NFT is successfully claimed
 * @returns the result of the transaction
 */

export const useClaimNFT = ({ onSuccess }: { onSuccess: () => void }): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const mintClause = buildClaimNftTx(thor)
    return [mintClause]
  }, [thor])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey: getB3trBadgeBalanceQueryKey(account),
    })
    await queryClient.refetchQueries({
      queryKey: getB3trBadgeBalanceQueryKey(account),
    })
    await queryClient.cancelQueries({
      queryKey: getParticipatedInGovernanceQueryKey(account),
    })
    await queryClient.refetchQueries({
      queryKey: getParticipatedInGovernanceQueryKey(account),
    })

    toast({
      title: "NFT Claimed",
      description: `You have correctly claimed your NFT!`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })

    onSuccess?.()
  }, [queryClient, toast, account])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
