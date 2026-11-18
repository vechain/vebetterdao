import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { fetchClient } from "@/api/indexer/api"

type ContractLookup = (address: string) => Promise<{ deploymentTxId: string } | null>
type TxBlockLookup = (txId: string) => Promise<number | null>

/**
 * The block a contract was deployed in, the lower bound for its event queries. 0 (scan from genesis)
 * when the indexer has no deployment for it, e.g. built-in contracts.
 */
export const fetchContractDeployBlock = async (
  address: string,
  getContract: ContractLookup,
  getTxBlock: TxBlockLookup,
): Promise<number> => {
  const contract = await getContract(address)
  if (!contract) return 0
  const block = await getTxBlock(contract.deploymentTxId)
  if (block === null) throw new Error(`Deployment tx ${contract.deploymentTxId} not found`)
  return block
}

export const useContractDeployBlock = (contractAddress: string) => {
  const thor = useThor()
  const query = useQuery({
    queryKey: ["contractDeployBlock", contractAddress?.toLowerCase()],
    queryFn: () =>
      fetchContractDeployBlock(
        contractAddress,
        async address => {
          const { data, response } = await fetchClient.GET("/api/v1/contracts/{address}", {
            params: { path: { address } },
          })
          if (response.status === 404) return null
          if (!data) throw new Error(`Indexer contract lookup failed: ${response.status}`)
          return data
        },
        async txId => (await thor.transactions.getTransaction(txId))?.meta.blockNumber ?? null,
      ),
    enabled: !!contractAddress && !!thor,
    retry: 1,
    staleTime: Infinity,
    gcTime: Infinity,
  })
  // A failed lookup only costs a wider scan, so callers that wait on this never stall.
  return { ...query, data: query.isError ? 0 : query.data }
}
