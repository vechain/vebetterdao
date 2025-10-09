import { getConfig } from "@repo/config"
import { isValid } from "@repo/utils/AddressUtils"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { getPendingLinkingsQueryKey } from "../api/contracts/vePassport/hooks/useGetPendingLinkings"

import { useBuildTransaction } from "./useBuildTransaction"

const PassportContractInterface = VeBetterPassport__factory.createInterface()
const passportContractAddress = getConfig().veBetterPassportContractAddress
const method = "linkEntityToPassport"
type UseLinkEntityToPassportProps = {
  onSuccess?: () => void
}
type ClausesParams = {
  passport: string
}
/**
 * Provides a React hook to link an entity to a passport using a blockchain transaction.
 * This hook integrates with the blockchain wallet and manages transaction state.
 */
export const useLinkEntityToPassport = ({ onSuccess }: UseLinkEntityToPassportProps) => {
  const { account } = useWallet()
  const clauseBuilder = useCallback(
    ({ passport }: ClausesParams) => {
      if (!account?.address) throw new Error("Account is required")
      if (!isValid(passport)) throw new Error("Invalid passport address")
      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method,
          args: [passport],
          comment: "link entity to passport",
        }),
      ]
    },
    [account?.address],
  )
  const refetchQueryKeys = useMemo(() => [getPendingLinkingsQueryKey(account?.address)], [account?.address])

  return useBuildTransaction<ClausesParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
