import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getEntitiesLinkedToPassportQueryKey, getPassportForEntityQueryKey, getPendingLinkingsQueryKey } from "@/api"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "acceptEntityLink"

type UseAcceptEntityLinkProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  entity: string
}

/**
 * Provides a React hook to accept an entity link using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useAcceptEntityLink = ({ onSuccess }: UseAcceptEntityLinkProps) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ entity }: ClausesParams) => {
      if (!account) throw new Error("Account is required")
      if (!isValid(entity)) throw new Error("Invalid entity address")

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [entity],
          comment: "accept entity link",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getPendingLinkingsQueryKey(account || ""),
      getEntitiesLinkedToPassportQueryKey(account || ""),
      getPassportForEntityQueryKey(account || ""),
    ],
    [account],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
