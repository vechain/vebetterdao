import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback } from "react"

import { getExitAnnouncedRoundQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useExitAnnouncedRound"
import { getIsNavigatorQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { getNavigatorStatusQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStatus"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type Props = {
  onSuccess?: () => void
}

export const useAnnounceExit = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback(
    () => [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "announceExit",
        args: [],
        comment: "Announce exit as navigator",
      }),
    ],
    [],
  )

  const handleSuccess = useCallback(() => {
    const addr = account?.address ?? ""
    queryClient.invalidateQueries({ queryKey: getNavigatorStatusQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getExitAnnouncedRoundQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getIsNavigatorQueryKey(addr) })
    invalidateNavigatorQueries(queryClient)
    queryClient.invalidateQueries({ queryKey: ["bestBlockCompressed"] })
    onSuccess?.()
  }, [queryClient, account, onSuccess])

  return useBuildTransaction({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
