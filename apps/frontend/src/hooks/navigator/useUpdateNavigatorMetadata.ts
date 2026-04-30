import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useCallback } from "react"

import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type UpdateMetadataParams = {
  metadataURI: string
}

type Props = {
  onSuccess?: () => void
}

export const useUpdateNavigatorMetadata = ({ onSuccess }: Props) => {
  const clauseBuilder = useCallback((params: UpdateMetadataParams) => {
    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "setMetadataURI",
        args: [params.metadataURI],
        comment: "Update navigator profile metadata",
      }),
    ]
  }, [])

  return useBuildTransaction<UpdateMetadataParams>({
    clauseBuilder,
    onSuccess,
  })
}
