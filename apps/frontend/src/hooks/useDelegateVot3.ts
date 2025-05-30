import { buildDelegateVot3Tx, getVotesQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"

import { useCallback, useMemo } from "react"
import { FormattingUtils } from "@repo/utils"
import { useThor, useWallet, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"

type useMintB3trProps = {
  address?: string
  onSuccess?: () => void
}
/**
 * Hook to mint a certain amount of B3TR tokens
 * This hook will send a mint transaction to the blockchain and wait for the txConfirmation
 * @param address the address to mint the tokens to
 * @param onSuccess callback to run when the upgrade is successful
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useDelegateVot3 = ({ address, onSuccess }: useMintB3trProps): UseSendTransactionReturnValue => {
  const thor = useThor()
  const { account } = useWallet()
  const toast = useToast()

  const clauseBuilder = useCallback(() => {
    if (!address) throw new Error("address is required")

    const clauses = buildDelegateVot3Tx(thor, address)
    return [clauses]
  }, [thor, address])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    const formattedAddress = FormattingUtils.humanAddress(address ?? "")

    toast({
      title: "Vot3 delegated succesfully",
      description: `${formattedAddress} has been delegated successfully`,
      status: "success",
      position: "bottom-left",
      duration: 5000,
      isClosable: true,
    })
    onSuccess?.()
  }, [toast, onSuccess, address])

  const refetchQueryKeys = useMemo(() => [getVotesQueryKey(account?.address ?? "")], [account?.address])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleOnSuccess,
  })
}
