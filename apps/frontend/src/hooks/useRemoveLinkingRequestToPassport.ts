import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { getPendingLinkingsQueryKey } from "@/api"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "cancelOutgoingPendingEntityLink"

type UseRemoveLinkingRequestToPassportProps = {
  onSuccess?: () => void
}

/**
 * Provides a React hook to cancel an outgoing pending entity link using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemoveLinkingRequestToPassport = ({ onSuccess }: UseRemoveLinkingRequestToPassportProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    if (!account?.address) throw new Error("Account is required")

    return [
      buildClause({
        to: passportContractAddress,
        contractInterface: PassportContractInterface,
        method,
        args: [],
        comment: "cancel outgoing pending entity link",
      }),
    ]
  }, [account?.address])

  const refetchQueryKeys = useMemo(() => [getPendingLinkingsQueryKey(account?.address || "")], [account?.address])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
