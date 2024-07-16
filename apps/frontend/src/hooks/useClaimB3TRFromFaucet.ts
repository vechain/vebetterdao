import { useCallback, useMemo } from "react"
import { B3TRFaucet__factory } from "@repo/contracts"
import { getConfig } from "@repo/config"
import { buildClause } from "@/utils/buildClause"
import { useBuildTransaction } from "./useBuildTransaction"
import { getB3TrBalanceQueryKey, getRemainingClaimsQueryKey } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"

const B3TRFaucetInterface = B3TRFaucet__factory.createInterface()

type Props = { onSuccess?: () => void }

/**
 * Custom hook for claiming from B3TR faucet
 */
export const useClaimB3TRFromFaucet = ({ onSuccess }: Props) => {
  const { account } = useWallet()

  const clauseBuilder = useCallback(() => {
    const clauses = []

    clauses.push(
      buildClause({
        to: getConfig().b3trFaucetAddress,
        contractInterface: B3TRFaucetInterface,
        method: "claimTokens",
        args: [],
        comment: `Claim B3TR from faucet`,
      }),
    )

    return clauses
  }, [])

  const refetchQueryKeys = useMemo(
    () => [
      getB3TrBalanceQueryKey(account ?? undefined) as string[],
      getB3TrBalanceQueryKey(getConfig().b3trFaucetAddress) as string[],
      getRemainingClaimsQueryKey(account ?? undefined) as string[],
    ],
    [account],
  )

  return useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess,
  })
}
