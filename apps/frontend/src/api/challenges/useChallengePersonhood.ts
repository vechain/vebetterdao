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

/**
 * Batch personhood check for a list of addresses against VeBetterPassport.isPerson(addr).
 * Mirrors the live `isPerson` check the B3TRChallenges contract performs on join/claim,
 * so the UI's verified/unverified verdict matches what the contract will allow.
 *
 * Returns a map keyed by lowercased address.
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

      const results = await executeMultipleClausesCall({
        thor,
        calls: unique.map(addr => ({
          abi,
          address,
          functionName: "isPerson",
          args: [addr],
        })),
      })

      return Object.fromEntries(
        unique.map((addr, index) => {
          const tuple = results[index] as unknown as [boolean, string] | undefined
          return [
            addr,
            {
              isPerson: !!tuple?.[0],
              reason: tuple?.[1] ?? "",
            } satisfies ChallengePersonhood,
          ]
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
 * Convenience hook for the viewer's personhood. Returns `undefined` while loading and
 * a `{ isPerson, reason }` object once the call resolves. Falls back to `{ isPerson: true }`
 * when no address is provided so guests don't see false "not verified" badges.
 */
export const useViewerPersonhood = (viewerAddress: string | undefined): ChallengePersonhood | undefined => {
  const addresses = useMemo(() => (viewerAddress ? [viewerAddress] : []), [viewerAddress])
  const { data } = useChallengePersonhoodBatch(addresses)
  if (!viewerAddress) return { isPerson: true, reason: "" }
  return data?.[normalize(viewerAddress)]
}
