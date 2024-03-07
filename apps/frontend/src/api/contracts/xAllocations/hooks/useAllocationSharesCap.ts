import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import { FormattingUtils } from "@repo/utils"

const XALLOCATIONPOOLCONTRACT = getConfig().xAllocationPoolContractAddress

/**
 * Get the max percentage of shares that an xDapp can have in a given round
 *
 * @param thor  the thor client
 * @returns  the percentage of the total shares that an xDapp can have
 */
export const getAllocationSharesCap = async (thor: Connex.Thor): Promise<string> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("appSharesCap").format("json")
  const res = await thor.account(XALLOCATIONPOOLCONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAllocationSharesCapQueryKey = () => ["allocationRound", "appSharesCap"]

/**
 * Get the max percetnage of shares that an xDapp can have in a given round
 *
 * @returns the percentage of the total shares that an xDapp can have
 */
export const useAllocationSharesCap = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationSharesCapQueryKey(),
    queryFn: async () => await getAllocationSharesCap(thor),
    enabled: !!thor,
  })
}
