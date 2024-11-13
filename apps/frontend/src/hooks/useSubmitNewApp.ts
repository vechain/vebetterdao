import { getXAppsQueryKey } from "@/api"
import { useQueryClient } from "@tanstack/react-query"
import { EnhancedClause, UseSendTransactionReturnValue, useSendTransaction } from "./useSendTransaction"
import { useCallback } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type useSubmitAppProps = {
  onSuccess?: () => Promise<void> | void
  invalidateCache?: boolean
  onSuccessMessageTitle?: string
}

type BuildClausesProps = {
  teamWalletAddress: string
  adminAddress: string
  appName: string
  appMetadataUri: string
}

type useSubmitAppReturnValue = {
  sendTransaction: (data: BuildClausesProps) => Promise<void>
} & Omit<UseSendTransactionReturnValue, "sendTransaction">

/**
 * Custom hook for submitting new applications to the X2EarnApps smart contract
 *
 * @param {useSubmitAppProps} props - Configuration options for the hook
 * @returns {useSubmitAppReturnValue} Object containing transaction functions and status
 *
 * @example
 * const { sendTransaction, status, error } = useSubmitNewApp({
 *   onSuccess: () => console.log("Success"),
 *   invalidateCache: true
 * });
 *
 * await sendTransaction({
 *   teamWalletAddress: "0x...",
 *   adminAddress: "0x...",
 *   appName: "My App",
 *   appMetadataUri: "ipfs://..."
 * });
 */
export const useSubmitNewApp = ({ onSuccess, invalidateCache = true }: useSubmitAppProps): useSubmitAppReturnValue => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const buildClauses = useCallback((data: BuildClausesProps) => {
    const clauses: EnhancedClause[] = [
      {
        to: getConfig().x2EarnAppsContractAddress,
        value: 0,
        data: X2EarnAppsInterface.encodeFunctionData("submitApp", [
          data.teamWalletAddress,
          data.adminAddress,
          data.appName,
          data.appMetadataUri,
        ]),
        comment: "Submit new app",
        abi: JSON.parse(JSON.stringify(X2EarnAppsInterface.getFunction("submitApp"))),
      },
    ]

    return clauses
  }, [])

  //Refetch queries to update ui after the tx is confirmed
  const handleOnSuccess = useCallback(async () => {
    if (invalidateCache) {
      await queryClient.cancelQueries({
        queryKey: getXAppsQueryKey(),
      })
      await queryClient.refetchQueries({
        queryKey: getXAppsQueryKey(),
      })
    }

    onSuccess?.()
  }, [invalidateCache, onSuccess, queryClient])

  const result = useSendTransaction({
    signerAccount: account,
    onTxConfirmed: handleOnSuccess,
  })

  /**
   * Send a transaction with the given clauses (in case you need to pass data to build the clauses to mutate directly)
   * @param vote the vote to cast
   * @param reason the reason for the vote
   * @returns see x@xxxx UseSendTransactionReturnValue}
   */
  const onMutate = useCallback(
    async (data: BuildClausesProps) => {
      const clauses = buildClauses(data)
      return result.sendTransaction(clauses)
    },
    [buildClauses, result],
  )

  return { ...result, sendTransaction: onMutate }
}
