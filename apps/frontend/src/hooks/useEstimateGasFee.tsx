import { useQuery } from "@tanstack/react-query"
import { ThorClient, useThor, useWallet } from "@vechain/vechain-kit"

type EstimateGasProps = Parameters<ThorClient["transactions"]["estimateGas"]>[0]

const GAS_PADDING = 0.1

export const useEstimateGasFee = ({ clauses, enabled = true }: { clauses: EstimateGasProps; enabled?: boolean }) => {
  const thor = useThor()
  const { account } = useWallet()

  return useQuery({
    queryKey: ["estimateGas", clauses],
    queryFn: () =>
      thor.transactions.estimateGas(clauses, account?.address, { gasPadding: GAS_PADDING }) as Promise<{
        totalGas: number
      }>,
    enabled,
  })
}
