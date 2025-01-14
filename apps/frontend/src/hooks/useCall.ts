import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { Interface, ethers } from "ethers"
import { useCallback, useMemo } from "react"
import { FormattingUtils } from "@repo/utils"

// Define a type to infer method names from the function definition
type MethodName<T> = T extends (nameOrSignature: infer U) => any ? U : never

/**
 * Parameters for the useCall hook.
 */
export type UseCallParams<T extends Interface> = {
  contractInterface: T // The contract interface
  contractAddress: string // The contract address
  method: MethodName<T["getFunction"]> // The mehod name
  args?: unknown[] // Optional arguments for the method
  keyArgs?: unknown[] // Optional key arguments for the query key
  enabled?: boolean // Whether the query should be enabled
  mapResponse?: (_res: Connex.VM.Output & Connex.Thor.Account.WithDecoded) => any // Optional functon to map the response
  formattedVersion?: boolean // Whether to return formatted versions of the result
}

/**
 * Custom hook for making contract calls.
 * @param contractInterface - The cotract interface.
 * @param contractAddress - The contract address.
 * @param method - The method name.
 * @param args - Optional arguments for the method.
 * @param keyArgs - Optional key arguments for the query key.
 * @param enabled - Whether the query should be enabled.
 * @param mapResponse - Optional function to map the response.
 * @param formattedVersion - Whether to return formatted versions of the result.
 * @returns The query result. If formattedVersion is true, returns [original, scaled, formatted].
 */
export const useCall = <T extends Interface>({
  contractInterface,
  contractAddress,
  method,
  args = [],
  keyArgs,
  enabled = true,
  mapResponse,
  formattedVersion = false,
}: UseCallParams<T>) => {
  const { thor } = useConnex()

  const queryFn = useCallback(async () => {
    try {
      const functionFragment = contractInterface?.getFunction(method)?.format("json")
      if (!functionFragment) throw new Error(`Method ${method} not found`)

      const res = await thor
        .account(contractAddress)
        .method(JSON.parse(functionFragment))
        .call(...args)

      if (res.vmError) return Promise.reject(new Error(`Method ${method} reverted: ${res.vmError}`))

      if (mapResponse) return mapResponse(res)

      const result = res.decoded[0]

      if (formattedVersion) {
        try {
          const scaled = ethers.formatEther(result)
          const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
          return {
            original: result,
            scaled,
            formatted,
          }
        } catch (e) {
          console.log("Failed to format value:", result)
          return result
        }
      }

      return result
    } catch (error) {
      console.error(
        `Error calling ${method}: ${(error as Error)?.message} with args: ${JSON.stringify(args)}`,
        (error as Error)?.stack,
      )
      throw error
    }
  }, [args, contractAddress, contractInterface, mapResponse, method, thor, formattedVersion])

  const queryKey = useMemo(() => getCallKey({ method, keyArgs: keyArgs || args }), [method, keyArgs, args])

  const enableQuery = useMemo(() => enabled, [enabled])

  return useQuery({
    queryFn,
    queryKey,
    enabled: enableQuery,
  })
}

export type GetCallKeyParams = {
  method: string
  keyArgs?: any[]
}

export const getCallKey = ({ method, keyArgs = [] }: GetCallKeyParams) => {
  return [method, ...keyArgs]
}
