import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getPendingLinkingsQueryKey } from "../api/contracts/vePassport/hooks/useGetPendingLinkings"

import { useBuildTransaction } from "./useBuildTransaction"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "denyIncomingPendingEntityLink"
type UseRejectEntityLinkProps = {
  onSuccess?: () => void
}
type ClausesParams = {
  entity: string
}
/**
 * Provides a React hook to reject an incoming pending entity link using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useRejectEntityLink = ({ onSuccess }: UseRejectEntityLinkProps) => {
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
          comment: "reject incoming pending entity link",
        }),
      ]
    },
    [account?.address],
  )
  const refetchQueryKeys = useMemo(() => [getPendingLinkingsQueryKey(account?.address || "")], [account?.address])

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
