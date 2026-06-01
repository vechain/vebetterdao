import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { VeBetterPassport__factory } from "@vechain/vebetterdao-contracts/factories/ve-better-passport/VeBetterPassport__factory"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

const abi = VeBetterPassport__factory.abi as any
const address = getConfig().veBetterPassportContractAddress as `0x${string}`
const ZERO_ADDR = "0x0000000000000000000000000000000000000000"

export type ChallengePersonhood = { isPerson: boolean; reason: string }

const normalize = (addr: string) => addr.toLowerCase()

export const getChallengePersonhoodBatchQueryKey = (addresses: string[]) =>
  ["challenges", "personhood", "batch", ...addresses.map(normalize).sort()] as const

const toBigInt = (value: unknown): bigint => {
  if (typeof value === "bigint") return value
  if (typeof value === "number" || typeof value === "string") return BigInt(value)
  return 0n
}

/**
 * Batch sybil check mirroring the V2 B3TRChallenges contract gate. We deliberately do NOT call
 * `isPerson` — it returns false for veDelegate delegators, locking honest users out. Instead we read
 * the two flags the contract actually checks: `isBlacklisted` per account and the global
 * `signalingThreshold` against per-account `signaledCounter`.
 *
 * Returns a map keyed by lowercased address; `isPerson: false` means "the on-chain gate would reject
 * this account" with `reason` matching the contract's revert string.
 */
export const useChallengePersonhoodBatch = (addresses: string[] | undefined) => {
  const thor = useThor()
  const contractOk = !!address && address.toLowerCase() !== ZERO_ADDR

  const unique = useMemo(() => {
    if (!addresses?.length) return [] as string[]
    return Array.from(new Set(addresses.map(normalize).filter(Boolean))).sort()
  }, [addresses])

  const query = useQuery({
    queryKey: getChallengePersonhoodBatchQueryKey(unique),
    queryFn: async () => {
      if (unique.length === 0) return {} as Record<string, ChallengePersonhood>

      // One signalingThreshold call (global) + isBlacklisted + signaledCounter per account.
      const calls = [
        { abi, address, functionName: "signalingThreshold" as const, args: [] as const },
        ...unique.flatMap(
          addr =>
            [
              { abi, address, functionName: "isBlacklisted" as const, args: [addr] as const },
              { abi, address, functionName: "signaledCounter" as const, args: [addr] as const },
            ] as const,
        ),
      ]

      const results = (await executeMultipleClausesCall({ thor, calls })) as unknown[]
      const threshold = toBigInt(results[0])

      return Object.fromEntries(
        unique.map((addr, index) => {
          const blacklisted = !!results[1 + index * 2]
          const signaled = toBigInt(results[2 + index * 2])
          const overSignaled = threshold !== 0n && signaled >= threshold
          if (blacklisted) {
            return [addr, { isPerson: false, reason: "User is blacklisted" } satisfies ChallengePersonhood]
          }
          if (overSignaled) {
            return [
              addr,
              { isPerson: false, reason: "User has been signaled too many times" } satisfies ChallengePersonhood,
            ]
          }
          return [addr, { isPerson: true, reason: "" } satisfies ChallengePersonhood]
        }),
      )
    },
    enabled: !!thor && contractOk && unique.length > 0,
    staleTime: 30_000,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/**
 * Convenience hook for the viewer's sybil verdict. Returns `undefined` while loading and
 * `{ isPerson, reason }` once the call resolves. Falls back to `{ isPerson: true }` when no address
 * is provided so guests don't see false "not verified" badges.
 */
export const useViewerPersonhood = (viewerAddress: string | undefined): ChallengePersonhood | undefined => {
  const addresses = useMemo(() => (viewerAddress ? [viewerAddress] : []), [viewerAddress])
  const { data } = useChallengePersonhoodBatch(addresses)
  if (!viewerAddress) return { isPerson: true, reason: "" }
  return data?.[normalize(viewerAddress)]
}
