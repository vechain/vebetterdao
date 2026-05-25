import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"

// VeDelegate is an ERC-721 factory; the user's TBA is derived from their NFT's tokenId.
// The vechain-energy/vedelegate-for-dapps example assumes tokenId = uint256(owner), but the
// contract doesn't enforce that, so look the real tokenId up via tokenOfOwnerByIndex and
// fall through to getPoolAddress only when the user actually owns an NFT.
const abi = [
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPoolAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

/** Resolves the veDelegate TBA address actually owned by `owner`. Returns undefined if the
 *  user owns no veDelegate NFT, or if the env has no veDelegate contract address configured. */
export const useVeDelegateOwnedTBA = (owner?: string) => {
  const veDelegateAddress = getConfig().veDelegateContractAddress

  // Step 1: read the real tokenId. Reverts when the user has no NFT, surfacing as isError.
  const tokenIdQuery = useCallClause({
    abi,
    address: veDelegateAddress as `0x${string}`,
    method: "tokenOfOwnerByIndex",
    args: [(owner ?? "0x0000000000000000000000000000000000000000") as `0x${string}`, 0n],
    queryOptions: {
      enabled: !!owner && !!veDelegateAddress,
      retry: false,
      select: data => data[0] as bigint,
    },
  })

  const tokenId = tokenIdQuery.data

  // Step 2: only resolve the pool address once we actually have a tokenId.
  const poolAddressQuery = useCallClause({
    abi,
    address: veDelegateAddress as `0x${string}`,
    method: "getPoolAddress",
    args: [tokenId as bigint],
    queryOptions: {
      enabled: !!tokenId && !!veDelegateAddress,
      select: data => {
        const addr = data[0] as string
        return addr && addr !== ZERO_ADDRESS ? addr : undefined
      },
    },
  })

  return {
    ...poolAddressQuery,
    data: poolAddressQuery.data,
    isLoading: tokenIdQuery.isLoading || (tokenIdQuery.isSuccess && poolAddressQuery.isLoading),
  }
}
