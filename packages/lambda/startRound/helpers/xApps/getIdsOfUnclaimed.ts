import { FunctionFragment } from "ethers"
import { XApp } from "../types"
import testnetConfig from "@repo/config/testnet"
import { ThorClient } from "@vechain/sdk-network"
import { xallocationsPoolABI } from "../const"
import { coder } from "@vechain/sdk-core"

export const getIdsOfUnclaimed = async (thor: ThorClient, xapps: XApp[], roundId: string): Promise<string[]> => {
  const unclaimed: string[] = []

  for (const xapp of xapps) {
    const res = await thor.contracts.executeContractCall(
      testnetConfig.xAllocationPoolContractAddress,
      coder.createInterface(xallocationsPoolABI).getFunction("claimed") as FunctionFragment,
      [roundId, xapp.id],
    )

    if (res.vmError) return Promise.reject(new Error(res.vmError))

    if (!res[0]) {
      unclaimed.push(xapp.id)
    }
  }

  return unclaimed
}
