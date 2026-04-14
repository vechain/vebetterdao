import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo } from "react"

import { getNavigatorFeeHistoryQueryKey } from "@/api/indexer/navigators/useNavigatorFeeHistory"
import { getNavigatorFeeSummaryQueryKey } from "@/api/indexer/navigators/useNavigatorFeeSummary"
import { buildClause } from "@/utils/buildClause"

import { useBuildTransaction } from "../useBuildTransaction"
import { getB3trBalanceQueryKey } from "../useGetB3trBalance"

const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()
const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

type ClaimParams = {
  roundIds: number[]
}

type Props = {
  onSuccess?: () => void
}

export const useClaimNavigatorFees = ({ onSuccess }: Props) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(
    (params: ClaimParams) =>
      params.roundIds.map(roundId =>
        buildClause({
          to: navigatorRegistryAddress,
          contractInterface: NavigatorRegistryInterface,
          method: "claimFee",
          args: [BigInt(roundId)],
          comment: `Claim navigator fee for round ${roundId}`,
        }),
      ),
    [],
  )

  const refetchQueryKeys = useMemo(
    () => [
      getNavigatorFeeSummaryQueryKey(account?.address),
      getNavigatorFeeHistoryQueryKey(account?.address ?? ""),
      getB3trBalanceQueryKey(account?.address),
    ],
    [account],
  )

  return useBuildTransaction<ClaimParams>({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
