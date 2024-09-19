import { getConfig } from "@repo/config"
import { GalaxyMember__factory } from "@repo/contracts"
import { getCallKey } from "@/hooks"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

const contractAddress = getConfig().galaxyMemberContractAddress
const contractInterface = GalaxyMember__factory.createInterface()
const method = "getTokensInfoByOwner"

/**
 * Generates a query key for the getTokensInfoByOwner query.
 * @param owner - The address of the token owner.
 * @param size - The number of tokens to fetch per page.
 * @returns An array representing the query key.
 */
export const getTokensInfoByOwnerQueryKey = (owner?: string | null, size?: number) =>
  getCallKey({ method, keyArgs: [owner, size] })

/**
 * Custom hook to fetch token information for a specific owner with infinite scrolling support.
 * @param owner - The address of the token owner.
 * @param size - The number of tokens to fetch per page.
 * @returns An infinite query result containing the token information and pagination controls.
 */
export const useGetTokensInfoByOwner = (owner: string | null, size: number) => {
  const { thor } = useConnex()

  const fetchTokens = async ({ pageParam = 0 }) => {
    const functionFragment = contractInterface.getFunction(method)?.format("json")
    if (!functionFragment) throw new Error(`Method ${method} not found`)

    const res = await thor.account(contractAddress).method(JSON.parse(functionFragment)).call(owner, pageParam, size)

    if (res.vmError) throw new Error(`Method ${method} reverted: ${res.vmError}`)

    const tokenInfoArray = res.decoded[0] as Array<[string, string, string, string]>
    const data = tokenInfoArray.map(([tokenId, tokenURI, tokenLevel, b3trToUpgrade]) => ({
      tokenId,
      tokenURI,
      tokenLevel,
      b3trToUpgrade,
    }))

    return { data, nextPage: pageParam + 1 }
  }

  return useInfiniteQuery({
    queryKey: getTokensInfoByOwnerQueryKey(owner, size),
    queryFn: fetchTokens,
    getNextPageParam: lastPage => (lastPage.data.length === size ? lastPage.nextPage : undefined),
    enabled: !!owner,
    initialPageParam: 0,
  })
}
