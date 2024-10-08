import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@repo/contracts"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "delegatePassport"

type UseDelegatePassportProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  delegatee: string
}

/**
 * Provides a React hook to propose a delegation using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useDelegatePassport = ({ onSuccess }: UseDelegatePassportProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ delegatee }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(delegatee)) throw new Error("Invalid delegatee address")

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [delegatee],
          comment: "propose delegation",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(() => [["delegations"]], [])

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
