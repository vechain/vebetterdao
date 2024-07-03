import { ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import { FunctionFragment, coder } from "@vechain/sdk-core"
import { XApp } from "../types"
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"

/**
 * Retrieves the xApps for the specified round.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 *
 * @returns an array of xApps Ids for the specified round.
 */
export const getRoundXApps = async (thor: ThorClient, roundId: string): Promise<string[]> => {
  const res = await thor.contracts.executeContractCall(
    mainnetConfig.xAllocationVotingContractAddress,
    XAllocationVoting.createInterface().getFunction("getAppIdsOfRound") as FunctionFragment,
    [Number(roundId)],
  )

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res[0]

  return apps
}
