import { getConfig } from "@repo/config"
import { useQueryClient } from "@tanstack/react-query"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"

import { getGetStakeQueryKey } from "@/api/contracts/navigatorRegistry/hooks/useGetStake"
import { invalidateNavigatorStakeHistoryQueries } from "@/api/contracts/navigatorRegistry/hooks/useNavigatorStakeHistory"
import { invalidateNavigatorQueries } from "@/api/indexer/navigators/useNavigators"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"
import { getB3trBalanceQueryKey } from "../useGetB3trBalance"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type WithdrawStakeParams = {
  // Wei, not a decimal string: withdrawStake reverts with InsufficientStake if the
  // requested amount exceeds the on-chain stake by even 1 wei, and a float round-trip
  // of an 18-decimal stake rounds up ~half the time.
  amountWei: bigint
}

type Props = {
  onSuccess?: () => void
}

export const useWithdrawStake = ({ onSuccess }: Props) => {
  const { account } = useWallet()
  const queryClient = useQueryClient()

  const clauseBuilder = useCallback((params: WithdrawStakeParams) => {
    return [
      buildClause({
        to: navigatorRegistryAddress,
        contractInterface: NavigatorRegistryInterface,
        method: "withdrawStake",
        args: [params.amountWei],
        comment: `Withdraw ${ethers.formatEther(params.amountWei)} B3TR stake`,
      }),
    ]
  }, [])

  const handleSuccess = useCallback(() => {
    const addr = account?.address ?? ""
    queryClient.invalidateQueries({ queryKey: getGetStakeQueryKey(addr) })
    queryClient.invalidateQueries({ queryKey: getB3trBalanceQueryKey(addr) })
    invalidateNavigatorQueries(queryClient)
    invalidateNavigatorStakeHistoryQueries(queryClient)
    queryClient.invalidateQueries({ queryKey: ["bestBlockCompressed"] })
    onSuccess?.()
  }, [queryClient, account, onSuccess])

  return useBuildTransaction<WithdrawStakeParams>({
    clauseBuilder,
    invalidateCache: false,
    onSuccess: handleSuccess,
  })
}
