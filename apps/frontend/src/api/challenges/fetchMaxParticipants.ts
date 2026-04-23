import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"

const abi = B3TRChallenges__factory.abi

/**
 * Imperative variant of `useMaxParticipants` — usable inside React Query
 * `queryFn` bodies where hooks are unavailable. Cached with a long stale time
 * since the value only changes via owner action.
 */
export const fetchMaxParticipants = (thor: ThorClient, contractAddress: string, queryClient: QueryClient) =>
  queryClient.fetchQuery({
    queryKey: ["challenges", "maxParticipants", contractAddress.toLowerCase()],
    queryFn: async () => {
      const [value] = (await executeMultipleClausesCall({
        thor,
        calls: [
          {
            abi,
            address: contractAddress as `0x${string}`,
            functionName: "maxParticipants" as const,
            args: [] as const,
          },
        ],
      })) as [bigint]
      return Number(value ?? 0n)
    },
    staleTime: 5 * 60 * 1000,
  })
