import { useCallback, useMemo } from "react"
import { X2EarnApps__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getXAppsQueryKey } from "@/api"

const X2EarnAppsInterface = X2EarnApps__factory.createInterface()

type Props = { onSuccess?: () => void }

type ClausesProps = {
  adminAddress?: string
  treasuryAddress?: string
  name?: string
  metadataURI?: string
}

/**
 * Custom hook for adding app
 */
export const useAddApp = ({ onSuccess }: Props) => {
  const clauseBuilder = useCallback(({ adminAddress, treasuryAddress, name, metadataURI }: ClausesProps) => {
    const clauses = []

    clauses.push(
      buildClause({
        to: getConfig().x2EarnAppsContractAddress,
        contractInterface: X2EarnAppsInterface,
        method: "addApp",
        args: [treasuryAddress, adminAddress, name, metadataURI],
        comment: `Add app ${name} with treasury address ${treasuryAddress} and admin address ${adminAddress}`,
      }),
    )

    return clauses
  }, [])

  const refetchQueryKeys = useMemo(() => [getXAppsQueryKey()], [])

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
