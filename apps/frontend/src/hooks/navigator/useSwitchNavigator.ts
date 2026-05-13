import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

import { getDelegateeQueryKey } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
import { useIsVeDelegated } from "@/hooks/useIsVeDelegated"
import { buildClause } from "@/utils/buildClause"

import { getVotesOnBlockPrefixQueryKey } from "../../api/contracts/governance/hooks/useVotesOnBlock"
import { getGetDelegatedAmountQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { getGetNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { getIsDelegatedQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { getIsNavigatorQueryKey } from "../../api/contracts/navigatorRegistry/hooks/useIsNavigator"
import { useBuildTransaction } from "../useBuildTransaction"
import { getVot3BalanceQueryKey } from "../useGetVot3Balance"
import { getVot3UnlockedBalanceQueryKey } from "../useGetVot3UnlockedBalance"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const PassportContractInterface = VeBetterPassport__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress
const passportContractAddress = getConfig().veBetterPassportContractAddress

type SwitchParams = {
  navigatorAddress: string
  amount: string
}

type Props = {
  onSuccess?: () => void
}

/** Undelegate from current navigator + delegate to a new one in a single multi-clause tx */
export const useSwitchNavigator = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()
  // Users already in the broken state (navigator-delegated AND passport-delegated to veDelegate)
  // who switch navigators would otherwise stay broken — veDelegate keeps shadowing the new navigator's vote.
  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")

  const clauseBuilder = useCallback(
    (params: SwitchParams) => {
      const amountWei = ethers.parseEther(params.amount)

      const undelegateClause = buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "undelegate",
        args: [],
        comment: "Undelegate from current navigator",
      })
      const delegateClause = buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "delegate",
        args: [params.navigatorAddress, amountWei],
        comment: `Delegate ${params.amount} VOT3 to new navigator`,
      })

      if (!isVeDelegated) return [undelegateClause, delegateClause]

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method: "revokeDelegation",
          args: [],
          comment: "Revoke veDelegate passport delegation",
        }),
        undelegateClause,
        delegateClause,
      ]
    },
    [isVeDelegated],
  )

  const handleSuccess = useCallback(() => {
    const addr = account?.address ?? ""
    queryClient.invalidateQueries({ queryKey: getIsDelegatedQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetDelegatedAmountQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getGetNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getIsNavigatorQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3BalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getVot3UnlockedBalanceQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getDelegateeQueryKey(addr) })
    invalidateNavigatorQueries(queryClient)
    queryClient.invalidateQueries({ queryKey: ["get", "/api/v1/b3tr/navigators/citizens"] })
    queryClient.invalidateQueries({ queryKey: ["get", "/api/v1/b3tr/navigators/delegations"] })
    queryClient.invalidateQueries({ queryKey: getVotesOnBlockPrefixQueryKey() })
    queryClient.invalidateQueries({ queryKey: ["bestBlockCompressed"] })
    onSuccess?.()
  }, [queryClient, account, onSuccess])

  return useBuildTransaction<SwitchParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
