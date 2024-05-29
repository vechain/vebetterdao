import { getGMbalanceQueryKey, getTokenIdByAccountQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { EnhancedClause } from "@/hooks"
import { getConfig } from "@repo/config"

import { GalaxyMember__factory } from "@repo/contracts"

const GalaxyMemberInterface = GalaxyMember__factory.createInterface()

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
        to: getConfig().galaxyMemberContractAddress,
        value: 0,
        data: GalaxyMemberInterface.encodeFunctionData("freeMint"),
        comment: `Claim NFT`,
        abi: JSON.parse(JSON.stringify(GalaxyMemberInterface.getFunction("freeMint"))),
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
        queryKey: getGMbalanceQueryKey(account),
      })
    }

    toast({
      title: "Galaxy Member NFT Claimed",
      description: `You have correctly claimed your GM NFT!`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })

    onSuccess?.()
  }, [queryClient, toast, account, invalidateCache, onSuccess])

  const handleOnFailure = useCallback(() => {
    onFailure?.()
  }, [onFailure])

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
