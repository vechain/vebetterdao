import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { Interface } from "ethers"

// Define a type to infer method names from the function definition
type MethodName<T> = T extends (nameOrSignature: infer U) => any ? U : never

export type UseCallParams<T extends Interface> = {
  contractInterface: T
  contractAddress: string
  method: MethodName<T["getFunction"]>
  args?: unknown[]
  keyArgs?: unknown[]
  enabled?: boolean
  mapResponse?: (res: any) => any
}

export const useCall = <T extends Interface>({
  contractInterface,
  contractAddress,
  method,
  args = [],
  keyArgs = [],
  enabled = true,
  mapResponse,
}: UseCallParams<T>) => {
  const { thor } = useConnex()

  const queryFn = async () => {
    const functionFragment = contractInterface?.getFunction(method)?.format("json")
    if (!functionFragment) throw new Error(`Method ${method} not found`)

    const res = await thor
      .account(contractAddress)
      .method(JSON.parse(functionFragment))
      .call(...args)

    if (res.vmError) return Promise.reject(new Error(`Method ${method} reverted: ${res.vmError}`))

    if (mapResponse) return mapResponse(res)

    return res.decoded[0]
  }

  return useQuery({
    queryFn: queryFn,
    queryKey: getCallKey({ method, keyArgs: keyArgs || args }),
    enabled: !!thor && thor.status.head.number > 0 && enabled,
  })
}

export type GetCallKeyParams = {
  method: string
  keyArgs?: any[]
}

export const getCallKey = ({ method, keyArgs }: GetCallKeyParams) => {
  return [method, ...(keyArgs || [])]
}
