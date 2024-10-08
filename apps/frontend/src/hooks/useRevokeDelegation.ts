import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { buildClause } from "@/utils/buildClause"
import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@repo/contracts"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "revokeDelegation"

type UseRevokeDelegationProps = {
  onSuccess?: () => void
}

/**
 * Provides a React hook to revoke a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRevokeDelegation = ({ onSuccess }: UseRevokeDelegationProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    if (!account) throw new Error("Account is required")

    return [
      buildClause({
        to: passportContractAddress,
        contractInterface: PassportContractInterface,
        method,
        args: [],
        comment: "revoke delegation",
      }),
    ]
  }, [account])

  const refetchQueryKeys = useMemo(() => [["delegations"]], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
