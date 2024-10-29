import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@repo/contracts"
import { getEntitiesLinkedToPassportQueryKey, getIsEntityQueryKey, getPassportForEntityQueryKey } from "@/api"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "removeEntityLink"

type UseRemoveEntityLinkProps = {
  onSuccess?: () => void
}

type ClausesParams = {
  entity: string
}

/**
 * Provides a React hook to remove an entity link using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRemoveEntityLink = ({ onSuccess }: UseRemoveEntityLinkProps) => {
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
          comment: "remove entity link",
        }),
      ]
    },
    [account],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getEntitiesLinkedToPassportQueryKey(account || ""),
      getPassportForEntityQueryKey(account || ""),
      getIsEntityQueryKey(account || ""),
    ],
    [account],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
