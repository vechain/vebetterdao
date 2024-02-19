import { getB3trBadgeBalanceKey, getParticipatedInGovernanceKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { buildClaimNFTTx } from "@/api/contracts/b3trBadge/utils"

export const useClaimNFT = ({ onSuccess }: { onSuccess: () => void }): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    const mintClause = buildClaimNFTTx(thor)
    return [mintClause]
  }, [thor])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey: getB3trBadgeBalanceKey(account),
    })
    await queryClient.refetchQueries({
      queryKey: getB3trBadgeBalanceKey(account),
    })
    await queryClient.cancelQueries({
      queryKey: getParticipatedInGovernanceKey(account),
    })
    await queryClient.refetchQueries({
      queryKey: getParticipatedInGovernanceKey(account),
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
