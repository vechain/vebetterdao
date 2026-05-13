import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

import { getDelegateeQueryKey, useGetDelegatee } from "@/api/contracts/vePassport/hooks/useGetDelegatee"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
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
  // Users already in the broken state (navigator-delegated AND passport-delegated) who switch
  // navigators would otherwise stay broken — the passport delegatee keeps shadowing the new
  // navigator's vote. Read the delegatee directly (works on every env, no VNS dependency).
  const {
    data: delegateeAddress,
    isLoading: isDelegateeLoading,
    isError: isDelegateeError,
  } = useGetDelegatee(account?.address)
  const isPassportDelegated = !!delegateeAddress

  const clauseBuilder = useCallback(
    (params: SwitchParams) => {
      // Fail loudly if the passport status is still unknown — see useDelegateToNavigator
      // for the same rationale (silent false reintroduces the original bug).
      if (isDelegateeLoading || isDelegateeError) {
        throw new Error("Passport delegation status not yet known — try again in a moment")
      }

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

      if (!isPassportDelegated) return [undelegateClause, delegateClause]

      return [
        buildClause({
          to: passportContractAddress,
          contractInterface: PassportContractInterface,
          method: "revokeDelegation",
          args: [],
          comment: "Revoke passport delegation",
        }),
        undelegateClause,
        delegateClause,
      ]
    },
    [isPassportDelegated, isDelegateeLoading, isDelegateeError],
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
