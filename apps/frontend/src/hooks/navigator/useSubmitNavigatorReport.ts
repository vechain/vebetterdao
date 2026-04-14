import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getLastReportRoundQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useGetLastReportRound"
import { getNavigatorReportEventsKey } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorReportEvents"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type SubmitReportParams = {
  reportURI: string
}

type Props = {
  onSuccess?: () => void
}

export const useSubmitNavigatorReport = ({ onSuccess }: Props) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    ({ reportURI }: SubmitReportParams) => [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "submitReport",
        args: [reportURI],
        comment: "Submit navigator report",
      }),
    ],
    [],
  )

  const refetchQueryKeys = useMemo(() => {
    const keys = [getLastReportRoundQueryKey(account?.address ?? "")]
    if (account?.address) {
      keys.push(getNavigatorReportEventsKey(account.address))
    }
    return keys
  }, [account?.address])

  return useBuildTransaction<SubmitReportParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
