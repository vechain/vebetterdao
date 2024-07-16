import { useCallback, useMemo } from "react"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getXAppsQueryKey } from "@/api"

const config = getConfig()

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()
const X2EARNAPPS_CONTRACT = config.x2EarnAppsContractAddress

type UseAddAppProps = {
  treasuryAddress: string
  adminAddress: string
  name: string
  metadataURI: string
  onSuccess?: () => void
}

/**
 * Custom hook for adding app
 */
export const useAddApp = ({ treasuryAddress, adminAddress, name, metadataURI, onSuccess }: UseAddAppProps) => {
  const clauseBuilder = useCallback(() => {
    return [
      buildClause({
        contractInterface: X2EarnAppsInterface,
        to: X2EARNAPPS_CONTRACT,
        method: "addApp",
        args: [treasuryAddress, adminAddress, name, metadataURI],
        comment: `Add app ${name} with treasury address ${treasuryAddress} and admin address ${adminAddress}`,
      }),
    ]
  }, [treasuryAddress, adminAddress, name, metadataURI])

  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
