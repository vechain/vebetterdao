import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { Interface } from "ethers"
import { useCallback, useMemo } from "react"
import { getCallKey, UseCallParams } from "./useCall"

/**
 * Result of a single call in useMultipleCalls
 */
export type UseCallResult<T = any> = {
  data: T | null
  error: Error | null
  success: boolean
}
/**
 * Custom hook for making multiple contract calls in parallel.
 * @param calls - Array of call configurations.
 * @returns Array of query results.
 */
export const useMultipleCalls = <T extends Interface>(calls: UseCallParams<T>[]) => {
  const { thor } = useConnex()

  const createQueryFn = useCallback(
    (params: UseCallParams<T>) => async () => {
      try {
        const functionFragment = params.contractInterface?.getFunction(params.method)?.format("json")
        if (!functionFragment) throw new Error(`Method ${params.method} not found`)

        const res = await thor
          .account(params.contractAddress)
          .method(JSON.parse(functionFragment))
          .call(...(params.args || []))

        if (res.vmError) return Promise.reject(new Error(`Method ${params.method} reverted: ${res.vmError}`))

        if (params.mapResponse) return params.mapResponse(res)

        return res.decoded[0]
      } catch (error) {
        console.error(
          `Error calling ${params.method}: ${(error as Error)?.message} with args: ${JSON.stringify(params.args)}`,
          (error as Error)?.stack,
        )
        throw error
      }
    },
    [thor],
  )

  const queries = useMemo(
    () =>
      calls.map(call => ({
        queryKey: getCallKey({ method: call.method, keyArgs: call.keyArgs || call.args }),
        queryFn: createQueryFn(call),
        enabled: call.enabled ?? true,
      })),
    [calls, createQueryFn],
  )

  return useQueries({
    queries,
    combine: queryResults => {
      // Refetch all queries
      const refetchAll = async () => {
        const refetchPromises = queryResults.map(result => result.refetch())
        return Promise.all(refetchPromises)
      }

      const callResults = queryResults.map(
        (result): UseCallResult => ({
          data: result.data ?? null,
          error: result.error as Error | null,
          success: !result.error && result.status === "success",
        }),
      )

      const hasFailures = callResults.some(result => !result.success)
      let error = null

      if (hasFailures) {
        error = new Error(
          `${callResults.filter(r => !r.success).length} call(s) failed: ${callResults
            .filter(r => !r.success)
            .map(r => r.error)
            .join(", ")}`,
        )
        ;(error as any).callErrors = callResults.filter(r => !r.success).map(r => r.error)
      }

      const extractedData = callResults.map(result => result.data)

      return {
        data: extractedData,
        results: extractedData,
        error,
        callResults,
        hasCallErrors: hasFailures,
        isError: queryResults.some(r => r.isError) || hasFailures,
        isPending: queryResults.some(r => r.isPending),
        isLoading: queryResults.some(r => r.isLoading),
        isFetching: queryResults.some(r => r.isFetching),
        refetch: refetchAll,
      }
    },
  })
}
