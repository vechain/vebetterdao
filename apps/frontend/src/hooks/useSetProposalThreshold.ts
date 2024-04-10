import { getProposalThresholdQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useConnex, useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const B3TRGovernorInterface = B3TRGovernor__factory.createInterface()

const config = getConfig()
import { ethers } from "ethers"

type useSetProposalThresholdProps = {
  amount?: string | number
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Hook to set the proposal threshold for the b3tr governor
 * @param amount the new proposal threshold to setin wei
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSetProposalThreshold = ({
  amount,
  onSuccess,
  invalidateCache = true,
}: useSetProposalThresholdProps): UseSendTransactionReturnValue => {
  const { thor } = useConnex()
  const { account } = useWallet()
  const toast = useToast()
  const queryClient = useQueryClient()

  const buildClauses = useCallback(() => {
    if (!amount) throw new Error("amount is required")
    const parsedAmount = ethers.parseEther(amount.toString())
    const clause: EnhancedClause = {
      to: config.b3trGovernorAddress,
      value: 0,
      data: B3TRGovernorInterface.encodeFunctionData("setProposalThreshold", [parsedAmount]),
      comment: `Change proposal threshold to ${amount}`,
      abi: JSON.parse(JSON.stringify(B3TRGovernorInterface.getFunction("setProposalThreshold"))),
    }
    return [clause]
  }, [thor, amount])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      //b3tr user balance
      await queryClient.cancelQueries({
        queryKey: getProposalThresholdQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getProposalThresholdQueryKey(),
      })
    }

    onSuccess?.()
  }, [invalidateCache, queryClient, toast, onSuccess, account, amount])

  const result = useSendTransaction({
    signerAccount: account,
    clauses: buildClauses,
    onTxConfirmed: handleOnSuccess,
  })

  return result
}
