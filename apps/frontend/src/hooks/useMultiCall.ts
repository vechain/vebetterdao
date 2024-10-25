import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

/**
 * Interface representing information about a clause that caused a revert.
 */
interface RevertInfo {
  /** Index of the clause that reverted */
  index: number
  /** Revert reason */
  reason: string
}

/**
 * Interface representing the result of the multi-call.
 */
interface MultiCallResult {
  /** Array of results from successfully executed clauses */
  results: Connex.VM.Output[]
  /** Indicates if any clause caused a revert */
  reverted: boolean
  /** Information about the clause that caused a revert, if any */
  revertInfo?: RevertInfo
}

/**
 * useMultiCall is a custom hook that executes multiple clauses using Connex in batches of up to 100 clauses.
 * If any clause causes a revert, the execution stops, and the hook returns the results up to that point along with revert information.
 *
 * @param {Connex.VM.Clause[]} clauses - Array of clauses to execute.
 * @param {QueryKey} queryKey - Unique key for the query, used by React Query for caching.
 * @param {UseQueryOptions<MultiCallResult, Error, MultiCallResult>} [options] - Optional React Query options.
 * @returns {UseQueryResult<MultiCallResult, Error>} An object containing the status and data of the query.
 */
export const useMultiCall = (
  clauses: Connex.VM.Clause[],
  queryKey: QueryKey,
  options?: UseQueryOptions<MultiCallResult, Error, MultiCallResult>,
) => {
  const { thor } = useConnex()

  return useQuery<MultiCallResult, Error, MultiCallResult>({
    queryKey,
    enabled: !!thor && clauses.length > 0,
    queryFn: async () => {
      const batchSize = 100
      let allResults: Connex.VM.Output[] = []
      let reverted = false
      let revertInfo: RevertInfo | undefined

      for (let i = 0; i < clauses.length; i += batchSize) {
        const batchClauses = clauses.slice(i, i + batchSize)
        const res = await thor.explain(batchClauses).execute()

        for (let j = 0; j < res.length; j++) {
          const result = res[j]
          if (result?.reverted) {
            reverted = true
            revertInfo = {
              index: i + j,
              reason: result.revertReason || "Unknown reason",
            }
            break
          } else {
            if (result) allResults.push(result)
          }
        }

        if (reverted) {
          break
        }
      }

      return { results: allResults, reverted, revertInfo }
    },
    ...options,
  })
}
