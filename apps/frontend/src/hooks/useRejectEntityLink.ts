import { useCallback, useMemo } from "react"
import { useWallet } from "@vechain/vechain-kit"
import { useBuildTransaction } from "./useBuildTransaction"
import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { buildClause } from "@/utils/buildClause"
import { VeBetterPassport__factory } from "@vechain-kit/vebetterdao-contracts"
import { getPendingLinkingsQueryKey } from "@/api"

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
