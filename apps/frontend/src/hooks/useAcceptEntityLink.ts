import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
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
      if (!account?.address) throw new Error("Account is required")
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
    [account?.address],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getPendingLinkingsQueryKey(account?.address || ""),
      getEntitiesLinkedToPassportQueryKey(account?.address || ""),
      getPassportForEntityQueryKey(account?.address || ""),
    ],
    [account?.address],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
