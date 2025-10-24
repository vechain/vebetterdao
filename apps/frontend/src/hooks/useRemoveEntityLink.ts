import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getEntitiesLinkedToPassportQueryKey } from "../api/contracts/vePassport/hooks/useGetEntitiesLinkedToPassport"
import { getPassportForEntityQueryKey } from "../api/contracts/vePassport/hooks/useGetPassportForEntity"
import { getIsEntityQueryKey } from "../api/contracts/vePassport/hooks/useIsEntity"

import { useBuildTransaction } from "./useBuildTransaction"

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
      if (!account?.address) throw new Error("Account is required")
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
    [account?.address],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getEntitiesLinkedToPassportQueryKey(account?.address || ""),
      getPassportForEntityQueryKey(account?.address || ""),
      getIsEntityQueryKey(account?.address || ""),
    ],
    [account?.address],
  )

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
