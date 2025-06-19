import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallClauseQueryKeyWithArgs, useThor, executeCallClause } from "@vechain/vechain-kit"
import { useInfiniteQuery } from "@tanstack/react-query"

const contractAddress = getConfig().galaxyMemberContractAddress
const abi = GalaxyMember__factory.abi
const method = "getTokensInfoByOwner" as const

/**
 * Generates a query key for the getTokensInfoByOwner query.
 * @param owner - The address of the token owner.
 * @param size - The number of tokens to fetch per page.
 * @returns An array representing the query key.
 */
export const getTokensInfoByOwnerQueryKey = (owner?: string, pageParam: number = 0, size: number = 10) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address: contractAddress,
    method,
    args: [owner as `0x${string}`, BigInt(pageParam), BigInt(size)],
  })

/**
 * Custom hook to fetch token information for a specific owner with infinite scrolling support.
 * @param owner - The address of the token owner.
 * @param size - The number of tokens to fetch per page.
 * @returns An infinite query result containing the token information and pagination controls.
 */
export const useGetTokensInfoByOwner = (owner: string, size: number = 10) => {
  const thor = useThor()

  const fetchTokens = async ({ pageParam = 0 }) => {
    const res = await executeCallClause({
      thor,
      contractAddress: contractAddress,
      abi,
      method,
      args: [owner as `0x${string}`, BigInt(pageParam), BigInt(size)],
    })

    const data = res[0].map(({ tokenId, tokenURI, tokenLevel, b3trToUpgrade }) => ({
      tokenId: tokenId.toString(),
      tokenURI: tokenURI.toString(),
      tokenLevel: tokenLevel.toString(),
      b3trToUpgrade: b3trToUpgrade.toString(),
    }))

    return { data, nextPage: pageParam + 1 }
  }

  return useInfiniteQuery({
    queryKey: getTokensInfoByOwnerQueryKey(owner),
    queryFn: fetchTokens,
    getNextPageParam: lastPage => (lastPage.data.length === size ? lastPage.nextPage : undefined),
    enabled: !!owner,
    initialPageParam: 0,
  })
}
