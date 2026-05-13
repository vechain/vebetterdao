import { getConfig } from "@repo/config"
import { useCallClause } from "@vechain/vechain-kit"

// VeDelegate uses ERC-6551-style TBAs deterministically derived from a tokenId,
// and the tokenId is `uint256(ownerAddress)`. See vechain-energy/vedelegate-for-dapps
// (src/modules/veDelegate/hooks/useVeDelegate.ts) for the same derivation.
const abi = [
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getPoolAddress",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

/** Resolves the veDelegate TBA address that would hold balance on behalf of `owner`.
 *  The pool address is deterministic (CREATE2) so this returns a non-zero address even
 *  if the user never deposited — callers should additionally check balance > 0. */
export const useVeDelegateOwnedTBA = (owner?: string) => {
  const veDelegateAddress = getConfig().veDelegateContractAddress
  // tokenId derivation: BigInt(address). Skip when address is malformed or env has no contract.
  const tokenId = owner && veDelegateAddress ? BigInt(owner) : undefined

  return useCallClause({
    abi,
    address: veDelegateAddress as `0x${string}`,
    method: "getPoolAddress",
    args: [tokenId as bigint],
    queryOptions: {
      enabled: !!owner && !!veDelegateAddress,
      select: data => {
        const addr = data[0] as string
        return addr && addr !== ZERO_ADDRESS ? addr : undefined
      },
    },
  })
}
