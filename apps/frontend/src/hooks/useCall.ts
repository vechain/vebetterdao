import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { Interface } from "ethers"

export type UseCallParams = {
  contractInterface: Interface
  contractAddress: string
  method: string
  args?: any[]
  keyArgs?: any[]
  enabled?: boolean
  mapResponse?: (res: any) => any
}

export const useCall = ({
  contractInterface,
  contractAddress,
  method,
  args = [],
  keyArgs = [],
  enabled = true,
  mapResponse,
}: UseCallParams) => {
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
