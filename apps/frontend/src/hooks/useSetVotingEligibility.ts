import { getAppsEligibleInNextRoundQueryKey } from "@/api"
import { useToast } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts"

const XAllocationVotingInterface = XAllocationVoting__factory.createInterface()

type Props = {
  appId: string
  isEligible: boolean
  appName?: string
  onSuccess?: () => void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}
/**
 * Admin can change the eligibility of an app in the next round
 *
 * @param onSuccess callback to run when the upgrade is successful
 * @param invalidateCache boolean to indicate if the related react-query cache should be updated (default: true)
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSetVotingEligibility = ({
  appId,
  isEligible,
  appName,
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
        data: XAllocationVotingInterface.encodeFunctionData("setVotingElegibility", [appId, isEligible]),
        comment: `Set voting eligibility for app ${appName} (id: ${appId}) to ${isEligible}`,
        abi: JSON.parse(JSON.stringify(XAllocationVotingInterface.getFunction("setVotingElegibility"))),
      },
    ]

    return clauses
  }, [appId, isEligible, appName])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getAppsEligibleInNextRoundQueryKey(),
      })

      await queryClient.refetchQueries({
        queryKey: getAppsEligibleInNextRoundQueryKey(),
      })
    }

    toast({
      title: "Success!",
      description: "The voting eligibility has been updated",
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
