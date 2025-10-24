import { getConfig } from "@repo/config"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useCallback, useMemo } from "react"

import { buildClause } from "@/utils/buildClause"

import { APP_SECURITY_LEVELS, getAppSecurityLevelQueryKey } from "../api/contracts/vePassport/hooks/useAppSecurityLevel"

import { useBuildTransaction } from "./useBuildTransaction"

const VeBetterPassportInterface = VeBetterPassport__factory.createInterface()
const VE_BETTER_PASSPORT_ADDRESS = getConfig().veBetterPassportContractAddress
type Props = {
  appId: string
  securityLevel: number
  onSuccess?: () => void
  onSuccessMessageTitle?: string
}
/**
 * Update the security level for an app in the VeBetterPassport contract
 *
 * @param {string} props.appId - the app id to update the security level for
 * @param {number} props.securityLevel - the new security level
 * @returns the return value of the send transaction hook and the result of the transaction
 */
export const useUpdateAppSecurityLevel = ({ appId, securityLevel, onSuccess }: Props) => {
  const clauseBuilder = useCallback(() => {
    const clauses = buildClause({
      contractInterface: VeBetterPassportInterface,
      to: VE_BETTER_PASSPORT_ADDRESS,
      method: "setAppSecurity",
      args: [appId, securityLevel],
      comment: `Update security level for app ${appId} to ${APP_SECURITY_LEVELS[securityLevel]}`,
    })
    return [clauses]
  }, [appId, securityLevel])
  const refetchQueryKeys = useMemo(() => [getAppSecurityLevelQueryKey(appId)], [appId])
  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
